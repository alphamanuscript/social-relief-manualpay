import { Db, Collection } from 'mongodb';
import { Transaction, TransactionStatus, TransactionCreateArgs, TransactionService, PaymentProvider, InitiateDonationArgs } from './types';
import { generateId } from '../util';
import { createDbOpFailedError, AppError, createResourceNotFoundError } from '../error';
import { User } from '../user';
import * as messages from '../messages';

const COLLECTION = 'transactions';

export interface TransactionsArgs {
  paymentProvider: PaymentProvider;
}

const isFinalStatus = (status: TransactionStatus) =>
  status === 'failed' || status === 'success';

export class Transactions implements TransactionService {
  private db: Db;
  private collection: Collection<Transaction>;
  private provider: PaymentProvider;
  private indexesCreated: boolean;

  constructor(db: Db, args: TransactionsArgs) {
    this.db = db;
    this.collection = this.db.collection(COLLECTION);
    this.provider = args.paymentProvider;
    this.indexesCreated = false;
  }
  sendDonation(from: User, to: User, args: import("./types").SendDonationArgs): Promise<Transaction> {
    throw new Error("Method not implemented.");
  }

  async createIndexes(): Promise<void> {
    if (this.indexesCreated) return;

    try {
      // unique provider transaction id
      await this.collection.createIndex({ providerTransactionId: 1, provider: 1 }, { unique: true });
      // ttl collection for access token expiry
      await this.collection.createIndex({ from: 1 });
      
      this.indexesCreated = true;
    }
    catch (e) {
      throw createDbOpFailedError(e.message);
    }
  }

  async getAllByUser(userId: string): Promise<Transaction[]> {
    try {
      const result = await this.collection.find({ $or: [{ from: userId }, { to: userId }] }).toArray();
      return result;
    }
    catch (e) {
      throw createDbOpFailedError(e.message);
    }
  }

  async initiateDonation(user: User, args: InitiateDonationArgs): Promise<Transaction> {
    const trxArgs: TransactionCreateArgs = {
      expectedAmount: args.amount,
      to: user._id,
      from: '',
      fromExternal: true,
      toExternal: false,
      type: 'donation',
      provider: this.provider.name()
    };

    try {
      const requestResult = await this.provider.requestPaymentFromUser(user, args.amount);
      trxArgs.providerTransactionId = requestResult.providerTransactionId;
      trxArgs.status = requestResult.status;
      const result = await this.create(trxArgs);
      return result;
    }
    catch (e) {
      if (e instanceof AppError) throw e;
      throw createDbOpFailedError(e.message);
    }
  }

  async handleProviderNotification(payload: any): Promise<Transaction> {
    try {
      const now = new Date();
      const result = await this.provider.handlePaymentNotification(payload);

      const updateRes = await this.collection.findOneAndUpdate(
        { providerTransactionId: result.providerTransactionId, provider: this.provider.name() },
        {
          $set: {
            status: result.status,
            failureReason: result.failureReason,
            metadata: result.metadata,
            updatedAt: now,
            amount: result.amount
          },
        });
      
      if (!updateRes.value) {
        // TODO: handle notifications that don't correspond to transactions
        // these are transactions that were not initiated for the app by a user
        throw createResourceNotFoundError(messages.ERROR_TRANSACTION_REQUESTED);
      }

      return updateRes.value;
    }
    catch (e) {
      if (e instanceof AppError) throw e;
      throw createDbOpFailedError(e.message);
    }
  }

  async checkUserTransactionStatus(userId: string, transactionId: string): Promise<Transaction> {
    try {
      const trx = await this.collection.findOne({ _id: transactionId, $or: [{ from: userId }, { to: userId }] });
      if (!trx) throw createResourceNotFoundError(messages.ERROR_TRANSACTION_NOT_FOUND);
      
      if (isFinalStatus(trx.status)) {
        return trx;
      }

      const providerResult = await this.provider.getTransaction(trx.providerTransactionId);
      const updatedRes = await this.collection.findOneAndUpdate(
        { _id: trx._id }, 
        {
          $set: {
            status: providerResult.status,
            failureReason: providerResult.failureReason,
            metadata: providerResult.metadata,
            updatedAt: new Date(),
            amount: providerResult.amount
        }
      }, { returnOriginal: false });
      
      if (!updatedRes.value) throw createResourceNotFoundError(messages.ERROR_TRANSACTION_NOT_FOUND);
      return updatedRes.value;
    }
    catch (e) {
      if (e instanceof AppError) throw e;
      throw createDbOpFailedError(e.message);
    }
  }

  private async create(args: TransactionCreateArgs): Promise<Transaction> {
    const now = new Date();
    const tx: Transaction = {
      _id: generateId(),
      ...args,
      amount: 0,
      providerTransactionId: args.providerTransactionId || '',
      status: args.status || 'pending',
      createdAt: now,
      updatedAt: now,
      metadata: {}
    };

    try {
      const res = await this.collection.insertOne(tx);
      return res.ops[0];
    }
    catch (e) {
      throw createDbOpFailedError(e.message);
    }
  }

}
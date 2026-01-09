import idempotencyModel from "./idempotency-model";

export class IdempotencyService {
  async get(idempotencyKey: string) {
    return await idempotencyModel.findOne({ key: idempotencyKey });
  }
}

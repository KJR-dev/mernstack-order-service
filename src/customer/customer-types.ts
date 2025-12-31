export interface Address {
  text: string;
  isDefault: boolean;
}

export interface Customer {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  address: Address[];
  tenantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

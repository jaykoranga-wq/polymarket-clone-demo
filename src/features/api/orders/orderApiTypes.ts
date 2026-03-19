// orderApiTypes.ts

export interface CreateOrderRequest {
  tokenId: string
  price: string
  type: number
  shares: string
  nonce: string
  salt: string
  signature: string
}

export interface CreateOrderResponse {
  statusCode: number
  status: boolean
  message: string
  data: {
    orderId: string
  }
}

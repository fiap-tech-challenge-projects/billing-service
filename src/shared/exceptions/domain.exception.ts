/**
 * Base domain exception
 * All domain-specific exceptions extend this class
 */
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = code
    Error.captureStackTrace(this, this.constructor)
  }
}

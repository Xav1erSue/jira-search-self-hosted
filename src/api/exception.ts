export class PresentableError extends Error {
  constructor(name: string, message: string) {
    super(message);
    this.name = name;
  }
}

export class Warning extends PresentableError {
  constructor(message: string) {
    super("Warning", message);
  }
}

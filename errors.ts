export class ENVNotDefined extends Error {
  constructor(envName: string) {
    super(`${envName} is not defined`);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

type CustomErrorTypes =
  | "USERNAME_NOT_FOUND"
  | "USERNAME_ALREADY_EXISTS"
  | "PASSWORD_AND_REPEAT_PASSWORD_NOT_SAME"
  | "INCORRECT_PASSWORD"
  | "GAME_NOT_FOUND"
  | "ROOM_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "USER_NOT_DEFAULT"
  | "USER_NOT_HOST"
  | "USER_ALREADY_IN_ROOM"
  | "USER_NOT_HOST_OR_OPPONENT"
  | "USER_HAS_NO_ROOM"
  | "QUESTION_NOT_FOUND"
  | "USER_IS_DEFAULT";

class CustomError extends Error {
  type: CustomErrorTypes;
  message: string;

  constructor({ message, type }: { message: string; type: CustomErrorTypes }) {
    super();
    this.message = message;
    this.type = type;
  }

  serialize = () => {
    return {
      type: this.type,
    };
  };
}

export const USERNAME_NOT_FOUND = new CustomError({
  message: "Could not find username",
  type: "USERNAME_NOT_FOUND",
});

export const USERNAME_ALREADY_EXISTS = new CustomError({
  message: "Username already exists",
  type: "USERNAME_ALREADY_EXISTS",
});

export const PASSWORD_AND_REPEAT_PASSWORD_NOT_SAME = new CustomError({
  message: "Password and repeat password are not the same",
  type: "PASSWORD_AND_REPEAT_PASSWORD_NOT_SAME",
});

export const INCORRECT_PASSWORD = new CustomError({
  message: "Incorrect password",
  type: "INCORRECT_PASSWORD",
});

export const GAME_NOT_FOUND = new CustomError({
  message: "Could not find game",
  type: "GAME_NOT_FOUND",
});

export const ROOM_NOT_FOUND = new CustomError({
  message: "Could not find room",
  type: "ROOM_NOT_FOUND",
});

export const USER_NOT_FOUND = new CustomError({
  message: "Could not find user",
  type: "USER_NOT_FOUND",
});

export const USER_NOT_DEFAULT = new CustomError({
  message: "User is not of default type",
  type: "USER_NOT_DEFAULT",
});

export const USER_NOT_HOST = new CustomError({
  message: "User is not of host type",
  type: "USER_NOT_HOST",
});

export const USER_ALREADY_IN_ROOM = new CustomError({
  message: "User is already in a room",
  type: "USER_ALREADY_IN_ROOM",
});

export const USER_NOT_HOST_OR_OPPONENT = new CustomError({
  message: "User is neither host or opponent of game",
  type: "USER_NOT_HOST_OR_OPPONENT",
});

export const USER_HAS_NO_ROOM = new CustomError({
  message: "User has no room",
  type: "USER_HAS_NO_ROOM",
});

export const QUESTION_NOT_FOUND = new CustomError({
  message: "Could not find question",
  type: "QUESTION_NOT_FOUND",
});

export const USER_CANNOT_BE_DEFAULT = new CustomError({
  message: "User is default and should not be",
  type: "QUESTION_NOT_FOUND",
});

export const isCustomError = (error: unknown): error is CustomError => {
  return error instanceof CustomError
}
import { IGenericErrorMessage } from "../interfaces/error";

const handleMongoUniqueError = (error: any) => {
  // const errors: IGenericErrorMessage[] = [
  //   {
  //     path: error.path || '',
  //     message: 'Invallid object id',
  //   },
  // ];
  const errors: IGenericErrorMessage[] = Object.keys(error.keyValue).map(
    key => ({
      path: error?.path || "",
      message: key + ": " + error?.keyValue[key] + " already exists.",
    }),
  );

  const statusCode = 400;
  return {
    statusCode,
    message: "Unique error",
    errorMessages: errors,
  };
};

export default handleMongoUniqueError;

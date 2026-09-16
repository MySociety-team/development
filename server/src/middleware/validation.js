import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";


const validate = (schema, property = "body") =>
  asyncHandler(async (req, _res, next) => {

    const { error, value } =
      schema.validate(
        req[property],
        {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: true
        }
      );


    if (error) {

      const details =
        error.details.map(
          (detail) => ({
            field:
              detail.path.join("."),
            message:
              detail.message
          })
        );


      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Request validation failed",
        details
      );

    }


    req[property] =
      value;


    next();

  });


export default validate;
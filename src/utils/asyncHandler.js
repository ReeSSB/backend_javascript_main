const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// const asyncHandler = () => {};
// const asyncHandler = (fn) =>{() => {}};
// const asyncHandler = (fn) =>{async() => {}};

// Either you can use this code below or written and used above. whatever you like. It works more synchronously
// const asyncHandler = (fn) => {
//   async (err, req, res, next) => {
//     try {
//       await fn(err, req, res, next);
//     } catch (error) {
//       res.status(err.code || 500).json({
//         success: false,
//         message: err.message,
//       });
//     }
//   };
// };

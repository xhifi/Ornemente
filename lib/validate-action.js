const validateAction = (schema, fn) => {
  return async (data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const parsedZodErrors = result.error.flatten();
      return {
        ok: false,
        error: parsedZodErrors,
        inputs: data,
      };
    }
    return await fn(result.data);
  };
};

export default validateAction;

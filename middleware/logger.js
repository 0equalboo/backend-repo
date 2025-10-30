const myLogger = (req, res, next) => {
    console.log(`요청 들어옴: ${req.method} ${req.path}`);
    next();
}

export default myLogger;
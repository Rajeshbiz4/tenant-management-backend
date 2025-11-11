const jwt = require('jsonwebtoken');
const TOCKEN_SECRET="09f26e402586e2faa8da4c98a35f1b20d6b033c6097befa8be3486a829587fe2f90a832bd3ff9d42710a4da095a2ce285b009f0c3730cd9b8e1af3eb84df6611";
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  if (authHeader == null) return res.sendStatus(401)

  jwt.verify(authHeader, TOCKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

module.exports = authenticateToken
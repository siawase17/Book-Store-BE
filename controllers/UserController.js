const conn = require('../mariadb');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

module.exports.join = (req, res) => {
    const { email, pwd } = req.body;
    const salt = crypto.randomBytes(10).toString('base64');
    const hashPwd = crypto.pbkdf2Sync(pwd, salt, 1000, 10, 'sha512').toString('base64');

    let sql = 'INSERT INTO users SET ?';
    let values = {
        email: email,
        pwd: hashPwd,
        salt: salt
    };

    conn.query(sql, values,
        (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            };
            if (results.affectedRows) {
                return res.status(StatusCodes.CREATED).json(results);
            } else {
                return res.status(StatusCodes.BAD_REQUEST).end();
            };
        });
};

module.exports.login = (req, res) => {
    const { email, pwd } = req.body
    let sql = 'SELECT * FROM users WHERE email = ?';

    conn.query(sql, email,
        (err, results) => {
            if (err) {
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            let loginUser = results[0];
            // salt 값을 꺼내 암호화
            const hashPwd = crypto.pbkdf2Sync(pwd, loginUser.salt, 1000, 10, 'sha512').toString('base64');
            // DB에 저장된 암호화 비밀번호화 비교
            if (loginUser && hashPwd === loginUser.pwd) {
                const token = jwt.sign({ id: loginUser.id, email: loginUser.email }, process.env.PRIVATE_KEY,
                    {
                        expiresIn: '30m',
                        issuer: 'yujin'
                    });

                res.cookie("token", token, { httpOnly: 'ture' });
                console.log(token);
                res.status(StatusCodes.OK).json(results);
            } else {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: "이메일 또는 비밀번호를 잘못 입력했습니다."
                });
            };
        });
};

module.exports.requestPwdReset = (req, res) => {
    const { email } = req.body;
    let sql = 'SELECT * FROM users WHERE email = ?';

    conn.query(sql, email,
        (err, results) => {
            if (err) {
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            const user = results[0];
            if (user) {
                return res.status(StatusCodes.OK).json({ "email": email });
            } else {
                return res.status(StatusCodes.UNAUTHORIZED).end();
            }
        });
};

module.exports.pwdReset = (req, res) => {
    const { email, pwd } = req.body;
    let sql = 'UPDATE users SET pwd = ?, salt = ? WHERE email = ?';
    const salt = crypto.randomBytes(10).toString('base64');
    const hashPwd = crypto.pbkdf2Sync(pwd, salt, 1000, 10, 'sha512').toString('base64');

    conn.query(sql, [hashPwd, salt, email],
        (err, results) => {
            if (err) {
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            if (results.affectedRows === 0) {
                return res.status(StatusCodes.BAD_REQUEST).end();
            } else {
                res.status(StatusCodes.OK).json(results);
            }
        });
};
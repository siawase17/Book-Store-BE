const conn = require('../mariadb');
const ensureAuth = require('../auth');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

// 장바구니 담기
module.exports.addCart = (req, res) => {
    let { book_id, quantity } = req.body;

    const authorization = ensureAuth(req);
    if (authorization instanceof jwt.TokenExpiredError) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            "message": "로그인 세션이 만료되었습니다. 다시 로그인 해주세요."
        });
    } else if (authorization instanceof jwt.JsonWebTokenError) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            "message": "잘못된 토큰입니다."
        });
    } else {
        let sql = `INSERT INTO cart_items SET  book_id=?, quantity=?, user_id=?`;

        conn.query(sql, [book_id, quantity, authorization.id],
            (err, results) => {
                if (err) {
                    return res.status(StatusCodes.BAD_REQUEST).end();
                }
                return res.status(StatusCodes.OK).json(results);
            });
    };
};

// 장바구니 품목 조회 & 장바구니에서 선택한 주문 예상 상품 목록 조회
module.exports.cartItems = (req, res) => {
    let { selected_items } = req.body;

    const authorization = ensureAuth(req);
    if (authorization instanceof jwt.TokenExpiredError) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            "message": "로그인 세션이 만료되었습니다. 다시 로그인 해주세요."
        });
    } else if (authorization instanceof jwt.JsonWebTokenError) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            "message": "잘못된 토큰입니다."
        });
    } else {
        let sql = `SELECT cart_items.id, book_id, title, summary, quantity, price 
        FROM cart_items
        LEFT JOIN books 
        ON cart_items.book_id = books.id
        WHERE user_id = ?`;
        let value = [authorization.id];

        if (selected_items) {
            sql += ' AND cart_items.id IN (?)'
            value.push(selected_items);
        }
    
        conn.query(sql, value,
            (err, results) => {
                if (err) {
                    return res.status(StatusCodes.BAD_REQUEST).end();
                }
                return res.status(StatusCodes.OK).json(results);
            });
    };
};

// 장바구니 품목 삭제
module.exports.deleteCartItem = (req, res) => {
    const authorization = ensureAuth(req);
    if (authorization instanceof jwt.TokenExpiredError) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            "message": "로그인 세션이 만료되었습니다. 다시 로그인 해주세요."
        });
    } else if (authorization instanceof jwt.JsonWebTokenError) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            "message": "잘못된 토큰입니다."
        });
    } else {
        const cartItems_id = req.params.id;
        let sql = 'DELETE FROM cart_items WHERE user_id = ? AND id = ?';
        let values = [authorization.id, cartItems_id];
        conn.query(sql, values,
            (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(StatusCodes.BAD_REQUEST).end();
                }
                return res.status(StatusCodes.OK).json(results);
            });
    }
};
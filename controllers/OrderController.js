const mariadb = require('mysql2/promise');
const ensureAuth = require('../auth');
const { StatusCodes } = require('http-status-codes');

// 결제
module.exports.order = async (req, res) => {
    const conn = await mariadb.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'Book_Shop',
        dateStrings: true
    });

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
        let { items, user, book_title, totalQuantity, totalPrice } = req.body;
        let sql = `UPDATE users 
    SET address = ?, receiver = ?, contact = ?
    WHERE id = ?`;
        let values = [user.address, user.receiver, user.contact, authorization.id];
        let [results] = await conn.execute(sql, values);

        sql = `INSERT INTO orders (book_title, total_quantity, total_price, user_id) 
    VALUES (?, ?, ?, ?)`;
        values = [book_title, totalQuantity, totalPrice, authorization.id];
        [results] = await conn.execute(sql, values);
        let order_id = results.insertId;

        sql = `SELECT book_id, quantity FROM cart_items WHERE id IN (?)`
        let [orderItems, fields] = await conn.query(sql, [items]);

        sql = `INSERT INTO ordered_book (order_id, book_id, quantity) VALUES ?`;
        values = [];
        orderItems.forEach((item) => {
            values.push([order_id, item.book_id, item.quantity]);
        })
        results = await conn.query(sql, [values]);

        let result = await deleteCartItems(conn, items);

        return res.status(StatusCodes.OK).json(result);
    };
};

const deleteCartItems = async (conn, items) => {
    let sql = `DELETE FROM cart_items WHERE id IN (?)`

    let result = await conn.query(sql, [items]);
    return result;
}

module.exports.getOrders = async (req, res) => {
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
        const conn = await mariadb.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'Book_Shop',
            dateStrings: true
        });

        let sql = `SELECT orders.*, address, receiver, contact FROM .orders 
    LEFT JOIN users ON orders.user_id = users.id;`;
        let [rows, fields] = await conn.query(sql);
        return res.status(StatusCodes.OK).json(rows);
    };
};

// 결제 상세 조회
module.exports.getOrderDetail = async (req, res) => {
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
        const { id } = req.params;
        const conn = await mariadb.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'Book_Shop',
            dateStrings: true
        });

        let sql = `SELECT books.id, title, author, price, ordered_book.quantity 
    FROM ordered_book LEFT JOIN books 
    ON ordered_book.book_id = books.id
    WHERE order_id = ?`;
        let [rows, fields] = await conn.query(sql, id);
        return res.status(StatusCodes.OK).json(rows);
    };
};
const conn = require('../mariadb');
const ensureAuth = require('../auth');
const { StatusCodes } = require('http-status-codes');

// 카테고리별 도서조회, 도서 전체 조회
module.exports.books = (req, res) => {
    let response = {};
    let { category_id, is_new, limit, page } = req.query;
    limit = parseInt(limit);
    page = parseInt(page);

    let offset = limit * (page - 1);
    let sql = 'SELECT SQL_CALC_FOUND_ROWS *, (SELECT count(*) FROM likes WHERE liked_book_id = books.id) AS likes FROM books';
    let values = [];
    if (category_id && is_new) {
        sql += ' WHERE category_id = ? AND pub_date > DATE_SUB(NOW(), INTERVAL 1 MONTH)';
        values = [category_id];
    } else if (category_id) {
        sql += ' WHERE category_id = ?';
        values = [category_id];
    } else if (is_new) {
        sql += ' WHERE pub_date > DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    };

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?'
    values.push(limit, offset);

    conn.query(sql, values,
        (err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }
            if (results.length) {
                response.books = results;
            } else {
                return res.status(StatusCodes.NOT_FOUND).end();
            }
        });

    sql = 'SELECT FOUND_ROWS()';
    conn.query(sql, values,
        (err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }
            let pagination = {};
            pagination.cur_page = parseInt(page);
            pagination.totalBook_cnt = results[0]["FOUND_ROWS()"];
            response.pagination = pagination;
            return res.status(StatusCodes.OK).json(response);
        });
};

// 도서 개별 조회
module.exports.book = (req, res) => {
    let book_id = req.params.id;
    book_id = parseInt(book_id);

    const authorization = ensureAuth(req);
    if (authorization instanceof jwt.TokenExpiredError) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            "message": "로그인 세션이 만료되었습니다. 다시 로그인 해주세요."
        });
    } else if (authorization instanceof jwt.JsonWebTokenError) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            "message": "잘못된 토큰입니다."
        });
    } else if (authorization instanceof ReferenceError) {
        let sql = `SELECT *, 
        (SELECT count(*) FROM likes WHERE liked_book_id = books.id) AS likes_cnt
        FROM books 
        LEFT JOIN category 
        ON books.category_id = category.category_id WHERE books.id = ?`;

        conn.query(sql, [book_id],
            (err, results) => {
                if (err) {
                    return res.status(StatusCodes.BAD_REQUEST).end();
                }
                if (results[0]) {
                    return res.status(StatusCodes.OK).json(results[0]);
                } else {
                    return res.status(StatusCodes.NOT_FOUND).end();
                }

            });
    } else {
        let sql = `SELECT *, 
    (SELECT count(*) FROM likes WHERE liked_book_id = books.id) AS likes_cnt,
    (SELECT EXISTS (SELECT * FROM Book_Shop.likes WHERE user_id = ? AND liked_book_id = ?)) AS is_liked
    FROM books 
    LEFT JOIN category 
    ON books.category_id = category.category_id WHERE books.id = ?`;

        conn.query(sql, [authorization.id, book_id, book_id],
            (err, results) => {
                if (err) {
                    return res.status(StatusCodes.BAD_REQUEST).end();
                }
                if (results[0]) {
                    return res.status(StatusCodes.OK).json(results[0]);
                } else {
                    return res.status(StatusCodes.NOT_FOUND).end();
                }

            });
    };
};
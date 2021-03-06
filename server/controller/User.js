/* eslint-disable consistent-return */
import bcrypt from 'bcrypt-nodejs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../model/db_connect';

dotenv.config();

class userController {
  /**
   * Create A user signup
   * @param {object} req
   * @param {object} res
   * @returns {object} user object
   */
  static userSignup(req, res) {
    const text = 'INSERT INTO users(firstname, lastName, email, phoneNumber, othername, registered, isadmin, password) VALUES($1, $2, $3,$4, $5, $6, $7, $8) returning id, firstname, lastname, isadmin';

    const value = [
      req.body.firstname,
      req.body.lastname,
      req.body.email,
      req.body.phonenumber,
      req.body.othername,
      new Date(),
      false,
      bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10)),
    ];

    pool.query(text, value)
      .then((user) => {
        const userDetail = {
          id: user.rows[0].id,
          isadmin: user.rows[0].isadmin,
        };
        jwt.sign({
          userDetail,
        }, process.env.SECRET, (err, token) => {
          if (err) {
            res.json({
              error: 'email already taken'
            });
          } else {
            return res.status(201).json({
              status: 201,
              message: 'New user created successfully',
              data: [{
                token,
                user: {
                  id:user.rows[0].id,
                  firstname: user.rows[0].firstname,
                  lastname: user.rows[0].lastname,
                  email: user.rows[0].email,
                  isadmin: user.rows[0].isadmin,
                },
              }],


            });
          }
        });
      })
      .catch(err => res.status(400).json({
        status: 400,
        error: 'email already used by another user',
      }));
  }

  /**
   * Login user
   * @param {object} req
   * @param {object} res
   * @returns {object} user object
   */
  static userLogin(req, res) {
    const text2 = 'SELECT id,password,firstname,lastname, email, isadmin FROM users WHERE email=$1';

    const value = [
      req.body.email,
    ];

    pool.query(text2, value)
      .then(
        (user) => {
          if (user.rows.length > 0) {
            const userDetail = {
              id: user.rows[0].id,
              isadmin: user.rows[0].isadmin,
            };
            bcrypt.compare(req.body.password, user.rows[0].password, (err, authPwd) => {
              if (authPwd) {
                jwt.sign({
                  userDetail,
                }, process.env.SECRET, (error, token) => {
                  if (error) {
                    return res.status(204).json({
                      error
                    });
                  }
                  return res.status(200).json({
                    status: 200,
                    message: 'User logged in successfully',
                    data: [{
                      token,
                      user: {
                        id:user.rows[0].id,
                        firstname: user.rows[0].firstname,
                        lastname: user.rows[0].lastname,
                        email: user.rows[0].email,
                        adminStatus: user.rows[0].isadmin,
                      },
                    }],
                  });
                });
              }
              else {
                return res.status(401).json({
                  status: 401,
                  error: 'wrong login credentials',
                });
              }
            });
          } else {
            return res.status(401).json({
              status: 401,
              error: 'wrong login credentials',
            });
          }
        },
      )
      .catch(err => res.status(400).json({
        status: 400,
        ER: 'error',
        message: err,
      }));
  }

  static resetPassword(req, res) {
    if (!req.body.userId || !req.body.newPwd) {
      return res.status(400).json({
        status: 400,
        error: 'Bad Request, please include user Id and new password in your request as parameter',
      });
    }

    const text = 'UPDATE users SET password=$1 where id=$2 RETURNING firstname, email';

    const value = [
      bcrypt.hashSync(req.body.newPwd, bcrypt.genSaltSync(10)),
      req.body.userId,
    ];

    pool.query(text, value)
      .then(user => res.status(200).json({
        status: 200,
        message: 'password successfully changed',
        data: {
          firstname: user.rows[0].firstname,
          email: user.rows[0].email,
        },
      }))
      .catch(err => res.status(400).json({
        error: 'no user found',
        err,
      }));
  }

  static userQuestion(req, res) {
    /**
     * Get A Question
     * @param {object} req
     * @param {object} res
     * @returns {object} question object
     */


    const text = `select questions.*, users.firstname, meetups.topic from questions
    left join meetups on questions.meetupid = meetups.id
    left join users on users.id = questions.createdby
where questions.createdby = $1`;
    const value = [req.params.userId];

    pool.query(text, value)
      .then(question => res.status(200).json({
        status: 200,
        data: question.rows,
      }))
      .catch(err => res.json(err));
  }
  static userComment(req, res) {
    /**
     * Get A Question
     * @param {object} req
     * @param {object} res
     * @returns {object} question object
     */


    const text = `select comments.*, users.firstname, questions.title from comments
    left join questions on questions.createdby = users.id
where comments.userid = $1`;

    const value = [req.params.userId];

    pool.query(text, value)
      .then(comment => res.status(200).json({
        status: 200,
        data: comment.rows,
      }))
      .catch(err => res.json(err));
  }
  static topFeeds(req, res) {
    /**
     * Get A top feeds
     * @param {object} req
     * @param {object} res
     * @returns {object} question object
     */


    const text = `select questions.*, comments.* from questions
    left join questions on questions.createdby = users.id
where questions.votes = $1`;

    const value = [req.params.userId];

    pool.query(text, value)
      .then(comment => res.status(200).json({
        status: 200,
        data: comment.rows,
      }))
      .catch(err => res.json(err));
  }
}
export default userController;
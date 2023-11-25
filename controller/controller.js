require("dotenv").config();
require("dotenv").config({
    path: `.env.${process.env.NODE_ENV}`,
})

const pool = require('../dbConnection');
const queries = require('./queries');
const axios = require("axios");
const https = require("https");

const migrate = async (req, res) => {
    const text = `
    DO $$ BEGIN
        IF NOT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = 'students'
        ) THEN
            CREATE TABLE students (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                age INT NOT NULL,
                dob DATE
            );
        END IF;
    END $$;
    `;
    try {
        await pool.query(text);
        res.status(200).json({message: 'Migrated successfully'});
    } catch (error) {
        console.error('Error executing SQL query ', error.stack)
        res.status(500).json({error: 'Error executing SQL query'});
    }
}

const dbSeed = async (req, res) => {
    const text = `
    INSERT INTO students (name, email, age, dob)
    VALUES 
    ('John Doe', 'johndoe@gmail.com', 20, '2000-01-01'),
    ('Thanh Truong', 'truong20it10@gmail.com', 22, '2001-01-01'),
    ('Duy Nghia', 'duynghia@gmail.com', 21, '2002-01-01'),
    ('Anna', 'anna@gmail.com', 19, '2000-01-01')
    `;
    try {
        await pool.query(text);
        res.status(200).json({message: 'Seeded successfully'});
    } catch (error) {
        console.error('Error executing SQL query ', error.stack)
        res.status(500).json({error: 'Error executing SQL query'});
    }
}

const deleteTable = async (req, res) => {
    const deleteText = `DELETE FROM students`;
    const migrateText = `
    DO $$ BEGIN
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'students'
    ) THEN
        DROP TABLE students;
    END IF;
    
    CREATE TABLE students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        age INT NOT NULL,
        dob DATE
    );
    
END $$;
    `;
    try {
        await pool.query(deleteText);
        await pool.query(migrateText);
        res.status(200).json({message: 'Drop and Migrate successfully'});
    } catch (error) {
        console.error('Error executing SQL query ', error.stack)
        res.status(500).json({error: 'Error executing SQL query'});
    }
}

const getStudents = async (req, res) => {
    try {
        await pool.query(queries.getStudents, (err, result) => {
            if (err) res.render('index', {'dataStudent': []});
            if (result.rows !== undefined) res.status(200).json(result.rows);
        });
    } catch (error) {
        res.render('index', {'dataStudent': []})
        //res.status(500).json({error: 'Error executing SQL query'});
    }
}

const getStudentById = async (req, res) => {
    const id = parseInt(req.params.id);
    pool.query(queries.getStudentById, [id], (err, result) => {
        if (err) res.status(400).json({error: 'Student does not exist'});
        res.status(200).json(result.rows);
    });
}

const createStudent = async (req, res) => {
    const {name, email, age, dob} = req.body;
    pool.query(
        queries.checkEmailExists, [email], (err, result) => {
            if (err) res.status(400).json({error: 'Error executing SQL query'});
            if (result.rows.length > 0) {
                res.status(400).json({error: 'Email already exists'});
                return;
            }
            pool.query(
                queries.createStudent, [name, email, age, dob], (err, result) => {
                    if (err) res.status(400).json({error: 'Error executing SQL query'});
                    res.status(201).json({message: 'Student created successfully'});
                });
        });
}

const deleteStudent = async (req, res) => {
    const id = parseInt(req.params.id);
    pool.query(
        queries.getStudentById, [id], (err, result) => {
            const noStudentDeleted = result.rowCount === 0;
            if (noStudentDeleted) {
                res.status(400).json({error: 'Student does not exist'});
                return;
            }
            pool.query(
                queries.deleteStudent, [id], (err, result) => {
                    if (err) res.status(400).json({error: 'Error executing SQL query'});
                    res.status(200).json({message: 'Student deleted successfully'});
                });
        });
}

const updateStudent = async (req, res) => {
    const id = parseInt(req.params.id);
    const {name, email, age, dob} = req.body;
    pool.query(
        queries.getStudentById, [id], (err, result) => {
            const noStudentUpdated = result.rowCount === 0;
            if (noStudentUpdated) {
                res.status(400).json({error: 'Student does not exist'});
                return;
            }
            pool.query(
                queries.updateStudent, [name, email, age, dob, id], (err, result) => {
                    if (err) res.status(400).json({error: 'Error executing SQL query'});
                    res.status(200).json({message: 'Student updated successfully'});
                });
        });
}

const indexView = async (req, res) => {
    const host = `${req.hostname === "localhost" ? '' : "https://" + req.hostname}/api/students`;
    try {
        const response = await axios.get(host);

        if (response.data.length > 0) {
            const students = response.data;
            const dobValue = students.map((student) => {
                return new Intl.DateTimeFormat('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }).format(new Date(student.dob));
            });

            students.forEach((student, index) => {
                student.dob = dobValue[index];
            });

            res.render('index', {
                dataStudent: students
            });
        }
    } catch (err) {
        console.error(err);

        res.render('log', {
            logError: err,
            host: host,
            dataStudent: []
        });
    }
}

const createStudentView = (req, res) => {
    res.render('create');
}

module.exports = {
    migrate,
    dbSeed,
    deleteTable,
    getStudents,
    getStudentById,
    createStudent,
    deleteStudent,
    updateStudent,
    indexView,
    createStudentView
}

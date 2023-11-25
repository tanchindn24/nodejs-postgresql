const { Router } = require('express');
const controller = require('./controller');

const router = Router();

//migration
router.get('/migrate', controller.migrate);
router.get('/seed', controller.dbSeed);
router.get('/delete', controller.deleteTable);

// api
router.get('/api/students/:id', controller.getStudentById);
router.post('/api/students/create', controller.createStudent);
router.delete('/api/students/delete/:id', controller.deleteStudent);
router.put('/api/students/update/:id', controller.updateStudent);
router.get('/api/students', controller.getStudents);

// view
//router.get('/create-student', controller.createStudentView);
router.get('/', controller.indexView);

module.exports = router

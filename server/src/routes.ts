import express from 'express';
import multer from 'multer';
import multerConfig from './config/multer'

import PointsController from './controller/PointsController';
import ItensController from './controller/ItensController';
import { celebrate, Joi } from 'celebrate';


const routes = express.Router();
const upload = multer(multerConfig);

const pointsController = new PointsController();
const itensController = new ItensController();

routes.get('/itens', itensController.index);
routes.get('/points', pointsController.index);
routes.get('/points/:id', pointsController.show);


routes.post('/points',
    upload.single('image'),
    celebrate({
        body: Joi.object().keys({
            name: Joi.string().required(),
            email: Joi.string().required().email(),
            whatspp: Joi.number().required(),
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
            city: Joi.string().required(),
            uf: Joi.string().required().max(2),
            itens: Joi.string().required(),
        })
    }, {
        abortEarly: false
        
    }),
    pointsController.create);
export default routes;
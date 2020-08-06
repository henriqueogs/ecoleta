import { Request, Response } from 'express';
import knex from '../database/connection';


class ItensController{
    async index(request: Request, response:Response){
        const itens = await knex('itens').select('*');
    
        const serializedItens = itens.map(iten => {
            return {
                id: iten.id,    
                title: iten.title,
                image_url: `http://192.168.30.107:3333/uploads/${iten.image}`,
            };
    
        });
    
        return response.json(serializedItens);
    }
}

export default ItensController;
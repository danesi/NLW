import {Request, Response} from 'express';
import knex from "../database/connection";

class PointsController {

    async index(req: Request, res: Response) {
        const {city, uf, items} = req.query;
        const parsedItems = String(items)
            .split(',')
            .map(item => Number(item.trim()));

        const points = await knex('point')
            .join('point_items', 'point.id', '=', 'point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('point.*');

        return res.json(points);
    }

    async show(req: Request, res: Response) {
        const {id} = req.params;

        const point = await knex('point').where('id', id).first();

        if (!point) {
            return res.status(400).json({message: "point not found"});
        }

        const items = await knex('items')
            .join('point_items', 'items.id', '=', 'point_items.item_id')
            .where('point_items.point_id', id)
            .select('items.title');

        return res.json({
            point,
            items
        });
    }

    async create(req: Request, res: Response) {
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = req.body;

        const trx = await knex.transaction();

        const point = {
            image: "https://images.unsplash.com/photo-1590995864835-f5d36f6518c8?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=750&q=60",
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        }

        const ids = await trx('point').insert(point);

        const pointItems = items.map((item_id: number) => {
            return {
                item_id,
                point_id: ids[0]
            }
        })

        await trx('point_items').insert(pointItems);

        await trx.commit();

        return res.json({
            id: ids[0],
            ...point,
        });
    }
}

export default PointsController;

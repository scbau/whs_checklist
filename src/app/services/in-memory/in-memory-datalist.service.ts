// import { InMemoryDbService } from 'angular-in-memory-web-api';
import { Hero } from '../../models/data';
import { List } from '../../models/list';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class InMemoryDataListService /*implements InMemoryDbService*/ {
    createDb() {
        const list = [
            {
                "id": 1,
                "label": "SCB",
                "contents": [
                    {
                        "id": 11, "label": "Brochures", "contents": [
                            { "id": 111, "label": "Automotive Range" },
                            { "id": 112, "label": "Dual Purpose Range" },
                            { "id": 113, "label": "Golf Cart Range" },
                            { "id": 114, "label": "Lawncare Range" },
                            { "id": 115, "label": "Marine Range" },
                            { "id": 116, "label": "Start-Stop Range" },
                            { "id": 117, "label": "Truck Range" },
                            { "id": 118, "label": "Gladiator Range" }
                        ]
                    },
                    {
                        "id": 12, "label": "Videos", "contents": [
                            { "id": 121, "label": "Supercharge M1 R5" },
                            { "id": 122, "label": "Supercharge M2" }
                        ]
                    }
                ]
            }
        ];
        return { list };
    }

    // Overrides the genId method to ensure that a hero always has an id.
    // If the heroes array is empty,
    // the method below returns the initial number (11).
    // if the heroes array is not empty, the method below returns the highest
    // hero id + 1.
    genId(list: List[]): number {
        return list.length > 0 ? Math.max(...list.map(list => list.id)) + 1 : 11;
    }
}
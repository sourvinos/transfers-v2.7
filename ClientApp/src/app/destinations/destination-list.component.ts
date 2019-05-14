import { Component, OnInit } from '@angular/core';
import { get } from 'scriptjs';

import { DestinationService } from '../services/destination.service';
import { IDestination } from '../models/destination';
import { Utils } from '../shared/classes/utils';

@Component({
    selector: 'destination-list',
    templateUrl: './destination-list.component.html',
    styleUrls: ['./destination-list.component.css']
})

export class DestinationListComponent implements OnInit {

    destinations: IDestination[];
    filteredDestinations: IDestination[];

    constructor(private service: DestinationService) { }

    triggerEvent(elem, event) {
        var clickEvent = new Event(event);
        elem.dispatchEvent(clickEvent);
    }

    ngOnInit() {
        get('script.js', () => { });
        this.service.getDestinations().subscribe(data => { this.filteredDestinations = this.destinations = data }, error => Utils.ErrorLogger(error));
    }

    filter(query: string) {
        this.filteredDestinations = query ? this.destinations.filter(p => p.description.toLowerCase().includes(query.toLowerCase())) : this.destinations;
    }

}
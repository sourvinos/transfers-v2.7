import { Location } from '@angular/common';
import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { KeyboardShortcuts, Unlisten } from 'src/app/services/keyboard-shortcuts.service';
import { Utils } from 'src/app/shared/classes/utils';
import { InteractionTransferService } from './../classes/service-interaction-transfer';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-transfer-wrapper',
    templateUrl: './wrapper-transfer.html',
    styleUrls: ['../../shared/styles/lists.css', './wrapper-transfer.css']
})

export class TransferWrapperComponent implements OnInit, OnDestroy {

    // #region Variables

    dateIn: string = ''
    dateInISO: string = ''

    actionToPerform: string = ''

    unlisten: Unlisten

    ngUnsubscribe = new Subject<void>();

    // #endregion Variables

    constructor(private keyboardShortcutsService: KeyboardShortcuts, private router: Router, private activatedRoute: ActivatedRoute, private location: Location, private interactionTransferService: InteractionTransferService) {
        this.unlisten = null
    }

    ngOnInit(): void {
        this.addShortcuts()
        this.focus('dateIn')
        this.subscribeToInderactionService()
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.unsubscribe();
        this.removeAllSummaryItemsFromLocalStorage()
    }

    // T
    deleteRecord() {
        this.interactionTransferService.sendData('deleteRecord')
    }

    // T
    loadTransfers() {
        if (this.isCorrectDate()) {
            this.updateLocalStorage()
            this.router.navigate(['dateIn/', this.dateInISO], { relativeTo: this.activatedRoute })
        }
    }

    // T
    newRecord() {
        this.router.navigate([this.location.path() + '/transfer/new'])
    }

    // T
    saveRecord() {
        this.interactionTransferService.sendData('saveRecord')
    }

    private addShortcuts() {
        this.unlisten = this.keyboardShortcutsService.listen({
            "Alt.S": (event: KeyboardEvent): void => {
                event.preventDefault()
                document.getElementById('search').click()
            },
            "Alt.N": (event: KeyboardEvent): void => {
                event.preventDefault()
                document.getElementById('new').click()
            }
        }, {
            priority: 1,
            inputs: true
        })
    }

    private focus(field: string) {
        Utils.setFocus(field)
    }

    private isCorrectDate() {
        let date = (<HTMLInputElement>document.getElementById('dateIn')).value
        if (date.length == 10) {
            this.dateInISO = moment(date, 'DD/MM/YYYY').toISOString(true)
            this.dateInISO = moment(this.dateInISO).format('YYYY-MM-DD')
            return true
        }
        else {
            this.dateInISO = ''
            return false
        }
    }

    private removeAllSummaryItemsFromLocalStorage() {
        localStorage.removeItem('transfers')
    }

    private updateLocalStorage() {
        localStorage.setItem('date', this.dateInISO)
    }

    private subscribeToInderactionService() {
        this.interactionTransferService.data.pipe(takeUntil(this.ngUnsubscribe)).subscribe(response => {
            this.actionToPerform = response
        })
    }

}

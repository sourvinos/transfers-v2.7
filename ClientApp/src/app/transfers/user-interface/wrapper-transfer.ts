import { TransferService } from './../classes/service-api-transfer';
import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { KeyboardShortcuts, Unlisten } from 'src/app/services/keyboard-shortcuts.service';
import { Utils } from 'src/app/shared/classes/utils';
import { InteractionTransferService } from './../classes/service-interaction-transfer';
import { MatDialog } from '@angular/material';
import { DialogAlertComponent } from 'src/app/shared/components/dialog-alert/dialog-alert.component';

@Component({
    selector: 'wrapper-transfer',
    templateUrl: './wrapper-transfer.html',
    styleUrls: ['../../shared/styles/lists.css', './wrapper-transfer.css']
})

export class WrapperTransferComponent implements OnInit, OnDestroy {

    // #region Variables

    dateIn: string = '01/10/2019'
    dateInISO: string = ''
    driver: string = '9'
    firstRecord: string = ''
    records: string[] = []

    recordStatus: string = 'empty'

    unlisten: Unlisten
    ngUnsubscribe = new Subject<void>();

    // #endregion Variables

    constructor(private keyboardShortcutsService: KeyboardShortcuts, private router: Router, private activatedRoute: ActivatedRoute, private location: Location, private interactionTransferService: InteractionTransferService, private transferService: TransferService, public dialog: MatDialog) { }

    ngOnInit(): void {
        this.addShortcuts()
        this.subscribeToInderactionService()
        this.focus('dateIn')
    }

    ngOnDestroy() {
        // console.log('Wrapper-onDestroy')
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.unsubscribe();
        this.unlisten && this.unlisten()
    }

    /**
     * Caller(s):
     *  Template - deleteRecord()
     * 
     * Description:
     *  Executes the delete method on the form through the interaction service
     */
    deleteRecord() {
        this.interactionTransferService.performAction('deleteRecord')
    }

    /**
     * Caller(s):
     *  Template - loadTransfers()
     * 
     * Description:
     *  Loads from the api the records for the given date
     */
    loadTransfers() {
        if (this.isCorrectDate()) {
            this.updateLocalStorage()
            this.router.navigate(['dateIn/', this.dateInISO], { relativeTo: this.activatedRoute })
        }
    }

    /**
     * Caller:
     *  Template - newRecord()
     * Description:
     *  Navigates to the form so that new records can be appended
     */
    newRecord() {
        this.router.navigate([this.location.path() + '/transfer/new'])
    }

    /**
     * Caller:
     *  Template - saveRecord()
     * 
     * Description:
     *  Executes the save method on the form through the interaction service
     */
    saveRecord() {
        this.interactionTransferService.performAction('saveRecord')
    }

    /**
     * Caller:
     *  Class - ngOnInit()
     * Description:
     *  Adds keyboard functionality
     */
    private addShortcuts() {
        this.unlisten = this.keyboardShortcutsService.listen({
            "Escape": (event: KeyboardEvent): void => {
                this.goBack()
            },
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

    /**
     * Caller:
     *  Class - ngOnInit()
     * Description:
     *  Calls the public method
     * @param field 
     */
    private focus(field: string) {
        Utils.setFocus(field)
    }

    /**
     * Caller:
     *  Class - loadTransfers()
     * Description:
     *  Checks for valid date
     */
    isCorrectDate() {
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

    /**
     * Caller: 
     *  Class - loadTransfers()
     * Description:
     *  Stores the given date to the localStorage for reading in later visits
     */
    private updateLocalStorage() {
        localStorage.setItem('date', this.dateInISO)
    }

    /**
     * Caller(s):
     *  Class - ngOnInit()
     * 
     * Description:
     *  Gets the record status from the form through the interaction service
     *  The variable 'recordStatus' will be checked by the template which decides which buttons to display
     */
    private subscribeToInderactionService() {
        this.interactionTransferService.recordStatus.subscribe(response => {
            this.recordStatus = response
        })
    }

    /**
     * Caller(s):
     *  Class - addShortcuts()
     * 
     * Description:
     *  On escape navigates to the home route
     */
    private goBack() {
        this.router.navigate(['/'])
    }

    assignDriver() {
        this.records = JSON.parse(localStorage.getItem('selectedIds'))
        console.log('From localStorage', this.records)
        const dialogRef = this.dialog.open(DialogAlertComponent, {
            height: '250px',
            width: '550px',
            data: {
                title: 'Select a driver',
                message: 'Combo goes here',
                actions: ['cancel', 'ok']
            },
            panelClass: 'dialog'
        })
        return dialogRef.afterClosed().subscribe(result => {
            if (result == "true") {
                this.transferService.assignDriver(this.driver, this.records).subscribe(result => {
                    console.log(result)
                })
            }
        })
    }

}

import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { Customer } from 'src/app/customers/classes/customer';
import { CustomerService } from 'src/app/customers/classes/customer.service';
import { Destination } from 'src/app/destinations/classes/destination';
import { DestinationService } from 'src/app/destinations/classes/destination.service';
import { Driver } from 'src/app/drivers/classes/driver';
import { DriverService } from 'src/app/drivers/classes/driver.service';
import { PickupPoint } from 'src/app/pickupPoints/classes/pickupPoint';
import { PickupPointService } from 'src/app/pickupPoints/classes/pickupPoint.service';
import { PortService } from 'src/app/ports/classes/port.service';
import { DialogIndexComponent } from 'src/app/shared/components/dialog-index/dialog-index.component';
import { InputTabStopDirective } from 'src/app/shared/directives/input-tabstop.directive';
import { ButtonClickService } from 'src/app/shared/services/button-click.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { HelperService } from 'src/app/shared/services/helper.service';
import { InteractionService } from 'src/app/shared/services/interaction.service';
import { KeyboardShortcuts, Unlisten } from 'src/app/shared/services/keyboard-shortcuts.service';
import { MessageService } from 'src/app/shared/services/message.service';
import { SnackbarService } from 'src/app/shared/services/snackbar.service';
import { Transfer } from '../classes/transfer';
import { TransferService } from '../classes/transfer.service';
import { PickupPointFlat } from './../../pickupPoints/classes/pickupPoint-flat';

@Component({
    selector: 'transfer-form',
    templateUrl: './transfer-form.html',
    styleUrls: ['./transfer-form.css']
})

export class TransferFormComponent implements OnInit, AfterViewInit, OnDestroy {

    //#region Private
    form: FormGroup
    unlisten: Unlisten
    ngUnsubscribe = new Subject<void>()
    //#endregion

    //#region Private particular
    defaultDriver: Driver
    customers: Customer[]
    destinations: Destination[]
    drivers: any[]
    pickupPoints: PickupPoint[]
    pickupPointsFlat: PickupPointFlat[]
    ports: any[]
    //#endregion

    //#region Form
    input: InputTabStopDirective
    //#endregion

    constructor(private activatedRoute: ActivatedRoute, private buttonClickService: ButtonClickService, private customerService: CustomerService, private destinationService: DestinationService, private dialogService: DialogService, private driverService: DriverService, private formBuilder: FormBuilder, private helperService: HelperService, private interactionService: InteractionService, private keyboardShortcutsService: KeyboardShortcuts, public dialog: MatDialog, private messageService: MessageService, private pickupPointService: PickupPointService, private portService: PortService, private router: Router, private snackbarService: SnackbarService, private transferService: TransferService) {
        this.activatedRoute.params.subscribe(p => {
            if (p.id) {
                this.getRecord(p.id)
            } else {
                this.driverService.getDefaultDriver().subscribe(result => {
                    this.defaultDriver = result
                    this.populateFormWithDefaultValues(this.defaultDriver)
                }, () => {
                    this.showSnackbar(this.messageService.noDefaultDriverFound(), 'error')
                })
            }
        })
    }

    ngOnInit() {
        this.initForm()
        this.scrollToForm()
        this.addShortcuts()
        this.populateDropDowns()
    }

    ngAfterViewInit() {
        this.focus('destinationDescription')
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next()
        this.ngUnsubscribe.unsubscribe()
        this.unlisten()
    }

    canDeactivate() {
        if (this.form.dirty) {
            this.dialogService.open('Warning', 'warningColor', this.messageService.askConfirmationToAbortEditing(), ['cancel', 'ok']).subscribe(response => {
                if (response) {
                    this.resetForm()
                    this.scrollToList()
                    this.onGoBack()
                    return true
                }
            })
        } else {
            this.scrollToList()
            return true
        }
    }

    public onCalculateTotalPersons() {
        const totalPersons = parseInt(this.form.value.adults, 10) + parseInt(this.form.value.kids, 10) + parseInt(this.form.value.free, 10)
        this.form.patchValue({ totalPersons: !!Number(totalPersons) ? totalPersons : 0 })
    }

    public onDelete() {
        this.dialogService.open('Warning', 'warningColor', this.messageService.askConfirmationToDelete(), ['cancel', 'ok']).subscribe(response => {
            if (response) {
                this.transferService.delete(this.form.value.id).subscribe(() => {
                    this.showSnackbar(this.messageService.showDeletedRecord(), 'info')
                    this.onGoBack()
                })
            }
        })
    }

    public onGoBack() {
        this.router.navigate(['../../'], { relativeTo: this.activatedRoute })
    }

    public onLookupIndex(lookupArray: any[], title: string, formFields: any[], fields: any[], headers: any[], widths: any[], visibility: any[], justify: any[], value: { target: { value: any } }) {
        const filteredArray = []
        lookupArray.filter(x => {
            const key = fields[1]
            if (x[key].toUpperCase().includes(value.target.value.toUpperCase())) {
                filteredArray.push(x)
            }
        })
        if (filteredArray.length > 0) {
            this.showModalIndex(filteredArray, title, fields, headers, widths, visibility, justify)
        }
        if (filteredArray.length === 0) {
            this.clearFields(null, formFields[0], formFields[1])
            this.focus(formFields[1])
        }
    }

    public onSave() {
        if (this.form.value.id === 0 || this.form.value.id === null) {
            this.transferService.add(this.form.value).subscribe(() => {
                this.showSnackbar(this.messageService.showAddedRecord(), 'info')
                this.focus('destinationDescription')
                this.resetForm()
                this.populateFormWithDefaultValues(this.defaultDriver)
                this.refreshSummaries()
            })
        } else {
            this.transferService.update(this.form.value.id, this.form.value).subscribe(() => {
                this.showSnackbar(this.messageService.showUpdatedRecord(), 'info')
                this.resetForm()
                this.onGoBack()
            })
        }
    }

    private addShortcuts() {
        this.unlisten = this.keyboardShortcutsService.listen({
            'Escape': () => {
                if (document.getElementsByClassName('cdk-overlay-pane').length === 0) {
                    this.onGoBack()
                }
            },
            'Alt.D': (event: KeyboardEvent) => {
                this.buttonClickService.clickOnButton(event, 'delete')
            },
            'Alt.S': (event: KeyboardEvent) => {
                if (document.getElementsByClassName('cdk-overlay-pane').length === 0) {
                    this.buttonClickService.clickOnButton(event, 'save')
                }
            },
            'Alt.C': (event: KeyboardEvent) => {
                if (document.getElementsByClassName('cdk-overlay-pane').length !== 0) {
                    this.buttonClickService.clickOnButton(event, 'cancel')
                }
            },
            'Alt.O': (event: KeyboardEvent) => {
                if (document.getElementsByClassName('cdk-overlay-pane').length !== 0) {
                    this.buttonClickService.clickOnButton(event, 'ok')
                }
            }
        }, {
            priority: 3,
            inputs: true
        })
    }

    private clearFields(result: any, id: any, description: any) {
        this.form.patchValue({ [id]: result ? result.id : '' })
        this.form.patchValue({ [description]: result ? result.description : '' })
    }

    private flattenPickupPoints(): any[] {
        this.pickupPointsFlat = []
        for (const {
            id: a,
            description: b,
            exactPoint: c,
            time: d
        } of this.pickupPoints) {
            this.pickupPointsFlat.push({ id: a, description: b, exactPoint: c, time: d })
        }
        return this.pickupPointsFlat
    }

    private focus(field: string) {
        this.helperService.setFocus(field)
    }

    private getListHeight() {
        return document.getElementById('listFormCombo').offsetHeight + 'px'
    }

    private getFormWidth() {
        return document.getElementById('listFormCombo').offsetWidth - 352 + 'px'
    }

    private getRecord(id: number) {
        this.transferService.getSingle(id).subscribe(result => {
            this.populateFields(result)
        }, () => {
            this.showSnackbar(this.messageService.showNotFoundRecord(), 'error')
            this.onGoBack()
        })
    }

    private initForm() {
        this.form = this.formBuilder.group({
            id: 0,
            dateIn: '',
            destinationId: [0, Validators.required], destinationDescription: ['', Validators.required],
            customerId: [0, Validators.required], customerDescription: ['', Validators.required],
            pickupPointId: [0, Validators.required], pickupPointDescription: ['', Validators.required],
            driverId: [0, Validators.required], driverDescription: [{ value: '', disabled: true }, Validators.required],
            portId: [0, Validators.required], portDescription: [Validators.required],
            adults: [0, [Validators.required, Validators.min(0), Validators.max(999)]],
            kids: [0, [Validators.required, Validators.min(0), Validators.max(999)]],
            free: [0, [Validators.required, Validators.min(0), Validators.max(999)]],
            totalPersons: 0,
            remarks: ['', Validators.maxLength(128)],
            userId: this.helperService.getUserIdFromLocalStorage()
        })
    }

    private patchFields(result: any, fields: any[]) {
        if (result) {
            Object.entries(result).forEach(([key, value]) => {
                this.form.patchValue({ [key]: value })
            })
        } else {
            fields.forEach(field => {
                this.form.patchValue({ [field]: '' })
            })
        }
    }

    private populateDropDowns() {
        const sources = []
        sources.push(this.customerService.getAllActive())
        sources.push(this.destinationService.getAllActive())
        sources.push(this.driverService.getAllActive())
        sources.push(this.pickupPointService.getAllActive())
        sources.push(this.portService.getAllActive())
        return forkJoin(sources).subscribe(
            result => {
                this.customers = result[0]
                this.destinations = result[1]
                this.drivers = result[2]
                this.pickupPoints = result[3]
                this.pickupPointsFlat = this.flattenPickupPoints()
                this.ports = result[4]
                this.renameObjects()
            })
    }

    private populateFields(result: Transfer) {
        this.form.setValue({
            id: result.id,
            dateIn: result.dateIn,
            destinationId: result.destination.id, destinationDescription: result.destination.description,
            customerId: result.customer.id, customerDescription: result.customer.description,
            pickupPointId: result.pickupPoint.id, pickupPointDescription: result.pickupPoint.description,
            portId: result.pickupPoint.route.port.id, portDescription: result.pickupPoint.route.port.description,
            driverId: result.driver.id, driverDescription: result.driver.description,
            adults: result.adults,
            kids: result.kids,
            free: result.free,
            totalPersons: result.totalPersons,
            remarks: result.remarks,
            userId: this.helperService.getUserIdFromLocalStorage()
        })
    }

    private populateFormWithDefaultValues(driver: Driver) {
        this.form.patchValue({
            id: 0,
            dateIn: this.helperService.getDateFromLocalStorage(),
            destinationId: 0, destinationDescription: '',
            customerId: 0, customerDescription: '',
            pickupPointId: 0, pickupPointDescription: '',
            adults: 0,
            kids: 0,
            free: 0,
            totalPersons: 0,
            driverId: driver.id,
            driverDescription: driver.description,
            portId: 0, portDescription: '',
            remarks: '',
            userId: this.helperService.getUserIdFromLocalStorage()
        })
    }

    private refreshSummaries() {
        this.interactionService.mustRefreshList()
    }

    private renameKey(obj: Object, oldKey: string, newKey: string) {
        if (oldKey !== newKey) {
            Object.defineProperty(obj, newKey, Object.getOwnPropertyDescriptor(obj, oldKey))
            delete obj[oldKey]
        }
    }

    private renameObjects() {
        this.destinations.forEach(obj => {
            this.renameKey(obj, 'id', 'destinationId')
            this.renameKey(obj, 'description', 'destinationDescription')
            this.renameKey(obj, 'isActive', 'destinationIsActive')
            this.renameKey(obj, 'userId', 'destinationUserId')
        })
        this.customers.forEach(obj => {
            this.renameKey(obj, 'id', 'customerId')
            this.renameKey(obj, 'description', 'customerDescription')
            this.renameKey(obj, 'isActive', 'customerIsActive')
            this.renameKey(obj, 'userId', 'customerUserId')
        })
        this.drivers.forEach(obj => {
            this.renameKey(obj, 'id', 'driverId')
            this.renameKey(obj, 'description', 'driverDescription')
            this.renameKey(obj, 'isActive', 'driverIsActive')
            this.renameKey(obj, 'userId', 'driverUserId')
        })
        this.ports.forEach(obj => {
            this.renameKey(obj, 'id', 'portId')
            this.renameKey(obj, 'description', 'portDescription')
            this.renameKey(obj, 'isActive', 'portIsActive')
            this.renameKey(obj, 'userId', 'portUserId')
        })
    }

    private resetForm() {
        this.helperService.resetForm(this.form)
    }

    private scrollToForm() {
        document.getElementById('content').style.width = this.getFormWidth()
        document.getElementById('content').style.height = this.getListHeight()
        document.getElementById('transferList').style.display = 'none'
    }

    private scrollToList() {
        document.getElementById('content').style.display = 'none'
        document.getElementById('transferList').style.display = 'flex'
        document.getElementById('custom-table-input').focus()
    }

    private showModalIndex(elements: any, title: string, fields: any[], headers: any[], widths: any[], visibility: any[], justify: any[]) {
        const dialog = this.dialog.open(DialogIndexComponent, {
            height: '685px',
            data: {
                records: elements,
                title: title,
                fields: fields,
                headers: headers,
                widths: widths,
                visibility: visibility,
                justify: justify
            }
        })
        dialog.afterClosed().subscribe((result) => {
            this.patchFields(result, fields)
        })
    }

    private showSnackbar(message: string, type: string) {
        this.snackbarService.open(message, type)
    }

    // #region Getters

    get destinationId() {
        return this.form.get('destinationId')
    }

    get destinationDescription() {
        return this.form.get('destinationDescription')
    }

    get customerId() {
        return this.form.get('customerId')
    }

    get customerDescription() {
        return this.form.get('customerDescription')
    }

    get pickupPointId() {
        return this.form.get('pickupPointId')
    }

    get pickupPointDescription() {
        return this.form.get('pickupPointDescription')
    }

    get adults() {
        return this.form.get('adults')
    }

    get kids() {
        return this.form.get('kids')
    }

    get free() {
        return this.form.get('free')
    }

    get totalPersons() {
        return this.form.get('totalPersons')
    }

    get driverId() {
        return this.form.get('driverId')
    }

    get driverDescription() {
        return this.form.get('driverDescription')
    }

    get portId() {
        return this.form.get('portId')
    }

    get portDescription() {
        return this.form.get('portDescription')
    }

    get remarks() {
        return this.form.get('remarks')
    }

    // #endregion Getters

}

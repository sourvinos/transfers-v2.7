import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatDialog } from '@angular/material'
import { ActivatedRoute, Router } from '@angular/router'
import { forkJoin, Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { CustomerService } from 'src/app/customers/classes/customer.service'
import { DestinationService } from 'src/app/destinations/classes/destination.service'
import { Driver } from 'src/app/drivers/classes/driver'
import { DriverService } from 'src/app/drivers/classes/driver.service'
import { PickupPointService } from 'src/app/pickupPoints/classes/pickupPoint.service'
import { PortService } from 'src/app/ports/classes/port.service'
import { Utils } from 'src/app/shared/classes/utils'
import { DialogIndexComponent } from 'src/app/shared/components/dialog-index/dialog-index.component'
import { BaseInteractionService } from 'src/app/shared/services/base-interaction.service'
import { DialogService } from 'src/app/shared/services/dialog.service'
import { HelperService } from 'src/app/shared/services/helper.service'
import { KeyboardShortcuts, Unlisten } from 'src/app/shared/services/keyboard-shortcuts.service'
import { MessageService } from 'src/app/shared/services/message.service'
import { SnackbarService } from 'src/app/shared/services/snackbar.service'
import { Transfer } from '../classes/transfer'
import { TransferService } from '../classes/transfer.service'

@Component({
    selector: 'transfer-form',
    templateUrl: './transfer-form.html',
    styleUrls: ['./transfer-form.css']
})

export class TransferFormComponent implements OnInit, AfterViewInit, OnDestroy {

    form: FormGroup
    defaultDriver: Driver

    destinations: any[]
    customers: any[]
    pickupPoints: any[]
    pickupPointsFlat: any[]
    drivers: any[]
    ports: any[]

    unlisten: Unlisten
    ngUnsubscribe = new Subject<void>()

    constructor(private destinationService: DestinationService, private customerService: CustomerService, private pickupPointService: PickupPointService, private driverService: DriverService, private portService: PortService, private activatedRoute: ActivatedRoute, private router: Router, private transferService: TransferService, private formBuilder: FormBuilder, public dialog: MatDialog, private helperService: HelperService, private keyboardShortcutsService: KeyboardShortcuts, private interactionService: BaseInteractionService, private snackbarService: SnackbarService, private dialogService: DialogService, private messageService: MessageService) {
        this.activatedRoute.params.subscribe(p => {
            if (p.id) {
                this.getRecord(p.id)
                this.setStatus('editRecord')
            } else {
                this.driverService.getDefaultDriver()
                    .then(response => {
                        this.defaultDriver = response
                        this.populateFormWithDefaultValues(this.defaultDriver)
                        this.setStatus('newRecord')
                    })
            }
        })
    }

    ngOnInit() {
        this.initForm()
        this.scrollToForm()
        this.addShortcuts()
        this.populateDropDowns()
        // this.subscribeToInteractionService()
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
            this.dialogService.open('Warning', '#FE9F36', this.messageService.askConfirmationToAbortEditing(), ['cancel', 'ok']).subscribe(response => {
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

    calculateTotalPersons() {
        const totalPersons = parseInt(this.form.value.adults, 10) + parseInt(this.form.value.kids, 10) + parseInt(this.form.value.free, 10)
        this.form.patchValue({ totalPersons: !!Number(totalPersons) ? totalPersons : 0 })
    }

    onDelete() {
        this.dialogService.open('Warning', '#FE9F36', this.messageService.askConfirmationToDelete(), ['cancel', 'ok']).subscribe(response => {
            if (response) {
                this.transferService.delete(this.form.value.id).subscribe(() => {
                    this.showSnackbar(this.messageService.showDeletedRecord(), 'info')
                    this.onGoBack()
                })
            }
        })
    }

    lookupIndex(lookupArray: any[], title: string, formFields: any[], fields: any[], headers: any[], widths: any[], visibility: any[], justify: any[], value: { target: { value: any } }) {
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

    onSave() {
        if (this.form.value.id === 0 || this.form.value.id === null) {
            this.transferService.add(this.form.value).subscribe(() => {
                this.showSnackbar(this.messageService.showAddedRecord(), 'info')
                this.resetForm()
                this.populateFormWithDefaultValues(this.defaultDriver)
                this.focus('destinationDescription')
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
                    document.getElementById('goBack').click()
                }
            },
            'Alt.D': (event: KeyboardEvent) => {
                event.preventDefault()
                document.getElementById('delete').click()
            },
            'Alt.S': (event: KeyboardEvent) => {
                if (document.getElementsByClassName('cdk-overlay-pane').length === 0) {
                    event.preventDefault()
                    document.getElementById('save').click()
                }
            },
            'Alt.C': (event: KeyboardEvent) => {
                event.preventDefault()
                if (document.getElementsByClassName('cdk-overlay-pane').length !== 0) {
                    document.getElementById('cancel').click()
                }
            },
            'Alt.O': (event: KeyboardEvent) => {
                event.preventDefault()
                if (document.getElementsByClassName('cdk-overlay-pane').length !== 0) {
                    document.getElementById('ok').click()
                }
            }
        }, {
            priority: 1,
            inputs: true
        })
    }

    private getListHeight() {
        return document.getElementById('listFormCombo').offsetHeight + 'px'
    }

    private getListWidth() {
        return document.getElementById('listFormCombo').offsetWidth - 32 + 'px'
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
            time: d,
            route: { port: { id: e, description: f } }
        } of this.pickupPoints) {
            this.pickupPointsFlat.push({ pickupPointId: a, pickupPointDescription: b, exactPoint: c, time: d, portId: e, portDescription: f })
        }
        return this.pickupPointsFlat
    }

    private focus(field: string) {
        Utils.setFocus(field)
    }

    private resetForm() {
        this.form.reset()
    }
    private getRecord(id: number) {
        this.transferService.getSingle(id).then(result => {
            console.log(result)
            this.populateFields(result)
        }, () => {
            this.showSnackbar(this.messageService.showNotFoundRecord(), 'error')
            this.onGoBack()
        })
    }

    private onGoBack() {
        this.setStatus('empty')
        this.router.navigate(['../../'], { relativeTo: this.activatedRoute })
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
            adults: [0, Validators.required],
            kids: [0, Validators.required],
            free: [0, Validators.required],
            totalPersons: 0,
            remarks: ['', Validators.maxLength(128)],
            userName: ''
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
        sources.push(this.destinationService.getAll())
        sources.push(this.customerService.getAll())
        sources.push(this.pickupPointService.getAll())
        sources.push(this.driverService.getAll())
        sources.push(this.portService.getAll())
        return forkJoin(sources).subscribe(
            result => {
                this.destinations = result[0]
                this.customers = result[1]
                this.pickupPoints = result[2]
                this.pickupPointsFlat = this.flattenPickupPoints()
                this.drivers = result[3]
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
            userName: result.userName
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
            userName: this.helperService.getUsernameFromLocalStorage()
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
            this.renameKey(obj, 'id', 'destinationId'); this.renameKey(obj, 'description', 'destinationDescription')
        })
        this.customers.forEach(obj => {
            this.renameKey(obj, 'id', 'customerId'); this.renameKey(obj, 'description', 'customerDescription')
        })
        this.drivers.forEach(obj => {
            this.renameKey(obj, 'id', 'driverId'); this.renameKey(obj, 'description', 'driverDescription')
        })
        this.ports.forEach(obj => {
            this.renameKey(obj, 'id', 'portId'); this.renameKey(obj, 'description', 'portDescription')
        })
    }

    private scrollToForm() {
        document.getElementById('content').style.width = this.getListWidth()
        document.getElementById('content').style.height = this.getListHeight()
        document.getElementById('transfersList').style.display = 'none'
    }

    private scrollToList() {
        document.getElementById('content').style.display = 'none'
        document.getElementById('transfersList').style.display = 'flex'
        document.getElementById('custom-table-input').focus()
        this.interactionService.performAction('')
    }

    private setStatus(status: string) {
        this.interactionService.setRecordStatus(status)
    }

    private showSnackbar(message: string, type: string): void {
        this.snackbarService.open(message, type)
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

    private subscribeToInteractionService() {
        this.interactionService.action.pipe(takeUntil(this.ngUnsubscribe)).subscribe(response => {
            if (response === 'saveRecord') { this.onSave() }
            if (response === 'deleteRecord') { this.onDelete() }
        })
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

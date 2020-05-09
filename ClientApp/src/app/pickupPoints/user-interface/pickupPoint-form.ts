import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { RouteService } from 'src/app/routes/classes/route.service';
import { DialogIndexComponent } from 'src/app/shared/components/dialog-index/dialog-index.component';
import { ButtonClickService } from 'src/app/shared/services/button-click.service';
import { HelperService } from 'src/app/shared/services/helper.service';
import { InteractionService } from 'src/app/shared/services/interaction.service';
import { KeyboardShortcuts, Unlisten } from 'src/app/shared/services/keyboard-shortcuts.service';
import { MessageService } from 'src/app/shared/services/message.service';
import { SnackbarService } from 'src/app/shared/services/snackbar.service';
import { DialogService } from '../../shared/services/dialog.service';
import { PickupPoint } from '../classes/pickupPoint';
import { PickupPointService } from '../classes/pickupPoint.service';

@Component({
    selector: 'pickuppoint-form',
    templateUrl: './pickupPoint-form.html',
    styleUrls: ['./pickupPoint-form.css']
})

export class PickupPointFormComponent implements OnInit, AfterViewInit, OnDestroy {

    routeId = 0
    activeRoute = 'form'
    form: FormGroup
    routes: any[]
    unlisten: Unlisten
    ngUnsubscribe = new Subject<void>()

    constructor(private pickupPointService: PickupPointService, private helperService: HelperService, private formBuilder: FormBuilder, private router: Router, private activatedRoute: ActivatedRoute, private keyboardShortcutsService: KeyboardShortcuts, private snackbarService: SnackbarService, private dialogService: DialogService, private messageService: MessageService, private buttonClickService: ButtonClickService, private interactionService: InteractionService, private routeService: RouteService, public dialog: MatDialog) {
        this.activatedRoute.params.subscribe(p => {
            this.interactionService.activeRoute(this.activeRoute)
            if (p.pickupPointId) {
                this.getRecord(p.pickupPointId)
            } else {
                this.routeId = parseInt(this.router.url.split('/')[3], 10)
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
        this.focus('routeDescription')
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

    onDelete() {
        this.dialogService.open('Warning', 'warningColor', this.messageService.askConfirmationToDelete(), ['cancel', 'ok']).subscribe(response => {
            if (response) {
                this.pickupPointService.delete(this.form.value.id).subscribe(() => {
                    this.showSnackbar(this.messageService.showDeletedRecord(), 'info')
                    this.onGoBack()
                }, () => {
                    this.showSnackbar(this.messageService.recordIsInUse(), 'error')
                })
            }
        })
    }

    onLookupIndex(lookupArray: any[], title: string, formFields: any[], fields: any[], headers: any[], widths: any[], visibility: any[], justify: any[], value: { target: { value: any } }) {
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
            this.pickupPointService.add(this.form.value).subscribe(() => {
                this.showSnackbar(this.messageService.showAddedRecord(), 'info')
                this.focus('routeDescription')
                this.resetForm()
            })
        } else {
            this.pickupPointService.update(this.form.value.id, this.form.value).subscribe(() => {
                this.showSnackbar(this.messageService.showUpdatedRecord(), 'info')
                this.resetForm()
                this.onGoBack()
            })
        }
    }

    private addShortcuts() {
        this.unlisten = this.keyboardShortcutsService.listen({
            'Escape': (): void => {
                if (document.getElementsByClassName('cdk-overlay-pane').length === 0) {
                    this.onGoBack()
                }
            },
            'Alt.D': (event: KeyboardEvent): void => {
                this.buttonClickService.clickOnButton(event, 'delete')
            },
            'Alt.S': (event: KeyboardEvent): void => {
                this.buttonClickService.clickOnButton(event, 'save')
            },
            'Alt.C': (event: KeyboardEvent): void => {
                if (document.getElementsByClassName('cdk-overlay-pane').length !== 0) {
                    this.buttonClickService.clickOnButton(event, 'cancel')
                }
            },
            'Alt.O': (event: KeyboardEvent): void => {
                if (document.getElementsByClassName('cdk-overlay-pane').length !== 0) {
                    this.buttonClickService.clickOnButton(event, 'ok')
                }
            }
        }, {
            priority: 2,
            inputs: true
        })
    }

    private clearFields(result: any, id: any, description: any) {
        this.form.patchValue({ [id]: result ? result.id : '' })
        this.form.patchValue({ [description]: result ? result.description : '' })
    }

    private focus(field: string) {
        this.helperService.setFocus(field)
    }

    private getListHeight() {
        return document.getElementById('listFormCombo').offsetHeight + 'px'
    }

    private getFormWidth() {
        return document.getElementById('listFormCombo').offsetWidth + 'px'
    }

    private getRecord(id: number) {
        this.pickupPointService.getSingle(id).then(result => {
            this.populateFields(result)
        }, () => {
            this.showSnackbar(this.messageService.showNotFoundRecord(), 'error')
            this.onGoBack()
        })
    }

    private initForm() {
        this.form = this.formBuilder.group({
            id: 0,
            routeId: ['', Validators.required], routeDescription: ['', Validators.required],
            description: ['', [Validators.required, Validators.maxLength(128)]],
            exactPoint: ['', [Validators.required, Validators.maxLength(128)]],
            time: ['', [Validators.required, Validators.pattern('[0-9][0-9]:[0-9][0-9]')]],
            userName: this.helperService.getUsernameFromLocalStorage()
        })
    }

    private onGoBack() {
        this.router.navigate(['../../'], { relativeTo: this.activatedRoute })
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
        sources.push(this.routeService.getAll())
        return forkJoin(sources).subscribe(
            result => {
                this.routes = result[0]
                this.renameObjects()
            }
        )
    }

    private populateFields(result: PickupPoint) {
        this.form.setValue({
            id: result.id,
            routeId: result.route.id, routeDescription: result.route.description,
            description: result.description,
            exactPoint: result.exactPoint,
            time: result.time,
            userName: result.userName
        })
    }

    private renameKey(obj: Object, oldKey: string, newKey: string) {
        if (oldKey !== newKey) {
            Object.defineProperty(obj, newKey, Object.getOwnPropertyDescriptor(obj, oldKey))
            delete obj[oldKey]
        }
    }

    private renameObjects() {
        this.routes.forEach(obj => {
            this.renameKey(obj, 'id', 'routeId'); this.renameKey(obj, 'description', 'routeDescription')
        })
    }

    private resetForm() {
        this.helperService.resetForm(this.form)
    }

    private scrollToForm() {
        document.getElementById('content').style.width = this.getFormWidth()
        document.getElementById('content').style.height = this.getListHeight()
        document.getElementById('pickupPointList').style.display = 'none'
    }

    private scrollToList() {
        document.getElementById('content').style.display = 'none'
        document.getElementById('pickupPointList').style.display = 'flex'
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

    private showSnackbar(message: string, type: string): void {
        this.snackbarService.open(message, type)
    }

    // #region Getters

    get routeDescription() {
        return this.form.get('routeDescription')
    }

    get description() {
        return this.form.get('description')
    }

    get exactPoint() {
        return this.form.get('exactPoint')
    }

    get time() {
        return this.form.get('time')
    }

    // #endregion

}

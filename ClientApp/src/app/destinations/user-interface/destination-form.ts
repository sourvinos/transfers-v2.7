import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { DestinationService } from 'src/app/destinations/classes/destination.service';
import { Utils } from 'src/app/shared/classes/utils';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { HelperService } from 'src/app/shared/services/helper.service';
import { KeyboardShortcuts, Unlisten } from 'src/app/shared/services/keyboard-shortcuts.service';
import { MessageService } from 'src/app/shared/services/message.service';
import { SnackbarService } from 'src/app/shared/services/snackbar.service';

@Component({
    selector: 'destination-form',
    templateUrl: './destination-form.html',
    styleUrls: ['../../shared/styles/forms.css']
})

export class DestinationFormComponent implements OnInit, AfterViewInit, OnDestroy {

    url = '/destinations'
    form: FormGroup
    unlisten: Unlisten
    ngUnsubscribe = new Subject<void>()

    constructor(private destinationService: DestinationService, private helperService: HelperService, private formBuilder: FormBuilder, private router: Router, private activatedRoute: ActivatedRoute, private keyboardShortcutsService: KeyboardShortcuts, private dialogService: DialogService, private snackbarService: SnackbarService, private messageService: MessageService) {
        this.activatedRoute.params.subscribe(p => {
            if (p.id) { this.getRecord(p.id) }
        })
    }

    ngOnInit() {
        this.initForm()
        this.addShortcuts()
    }

    ngAfterViewInit() {
        this.focus('abbreviation')
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
                    this.onGoBack()
                    return true
                }
            })
        } else {
            return true
        }
    }

    onDelete() {
        this.dialogService.open('Warning', '#FE9F36', this.messageService.askConfirmationToDelete(), ['cancel', 'ok']).subscribe(response => {
            if (response) {
                this.destinationService.delete(this.form.value.id).subscribe(() => {
                    this.showSnackbar(this.messageService.showDeletedRecord(), 'info')
                    this.resetForm()
                    this.onGoBack()
                }, () => {
                    this.showSnackbar(this.messageService.recordIsInUse(), 'error')
                })
            }
        })
    }

    onSave() {
        if (this.form.value.id === 0) {
            this.destinationService.add(this.form.value).subscribe(() => {
                this.showSnackbar(this.messageService.showAddedRecord(), 'info')
                this.resetForm()
                this.onGoBack()
            })
        } else {
            this.destinationService.update(this.form.value.id, this.form.value).subscribe(() => {
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

    private focus(field: string) {
        Utils.setFocus(field)
    }

    private getRecord(id: string | number) {
        this.destinationService.getSingle(id).then(result => {
            this.populateFields(result)
        }, () => {
            this.showSnackbar(this.messageService.showNotFoundRecord(), 'error')
            this.onGoBack()
        })
    }

    private onGoBack() {
        this.router.navigate([this.url])
    }

    private initForm() {
        this.form = this.formBuilder.group({
            id: 0,
            abbreviation: ['', [Validators.maxLength(5)]],
            description: ['', [Validators.required, Validators.maxLength(128)]],
            userName: this.helperService.getUsernameFromLocalStorage()
        })

    }

    private populateFields(result: any) {
        this.form.setValue({
            id: result.id,
            abbreviation: result.abbreviation,
            description: result.description,
            userName: result.userName
        })
    }

    private resetForm() {
        this.form.reset()
    }

    private showSnackbar(message: string, type: string): void {
        this.snackbarService.open(message, type)
    }

    // #region Getters

    get abbreviation() {
        return this.form.get('abbreviation')
    }

    get description() {
        return this.form.get('description')
    }

    // #endregion

}

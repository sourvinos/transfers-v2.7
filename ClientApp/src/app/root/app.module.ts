import { NgModule } from '@angular/core';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { RootComponent } from './root.component';
import { RouterModule } from '@angular/router';

import { MAT_LABEL_GLOBAL_OPTIONS } from '@angular/material';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material';
import { MatDialogModule } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { FooterComponent } from '../shared/components/footer/footer.component';
import { LoginComponent } from '../login/login.component';
import { MainComponent } from '../shared/components/main/main.component';
import { MenuComponent } from '../shared/components/menu/menu.component';
import { NavigationComponent } from '../shared/components/navigation/navigation.component';
import { UserInfoComponent } from '../shared/components/user-info/user-info.component';

import { CustomerListComponent } from '../customers/customer-list.component';
import { CustomerFormComponent } from '../customers/customer-form.component';

import { CountryFormComponent } from '../countries/country-form.component'
import { CountryListComponent } from '../countries/country-list.component';
import { DeleteDialogComponent } from '../shared/components/delete-dialog/delete-dialog.component';
import { HomeComponent } from '../home/home.component';
import { MessageDialogComponent } from '../shared/components/message-dialog/message-dialog.component';

import { AuthInterceptor } from '../services/auth.interceptor';

@NgModule({
    declarations: [
        RootComponent,
        UserInfoComponent,
        NavigationComponent,
        HomeComponent,
        MenuComponent,
        MainComponent,
        FooterComponent,
        LoginComponent,
        DeleteDialogComponent,
        MessageDialogComponent,
        CountryFormComponent, CountryListComponent,
        CustomerListComponent, CustomerFormComponent
    ],
    entryComponents: [
        DeleteDialogComponent,
        MessageDialogComponent
    ],
    imports: [
        BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
        BrowserAnimationsModule,
        FormsModule,
        HttpClientModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatSnackBarModule,
        MatToolbarModule,
        ReactiveFormsModule,
        RouterModule.forRoot([
            { path: '', component: HomeComponent, pathMatch: 'full' },
            { path: 'countries', component: CountryListComponent },
            { path: 'country/new', component: CountryFormComponent },
            { path: 'country/:id', component: CountryFormComponent },
            { path: 'customers', component: CustomerListComponent },
            { path: 'customer/new', component: CustomerFormComponent },
            { path: 'customer/:id', component: CustomerFormComponent },
            { path: 'login', component: LoginComponent }
        ])
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: MAT_LABEL_GLOBAL_OPTIONS, useValue: { float: 'always' } }

    ],
    bootstrap: [RootComponent]
})

export class AppModule { }

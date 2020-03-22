import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { CalcComponent } from './calc/calc.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule, MatSelectModule, MatCheckboxModule, MatCardModule, MatSlideToggleModule, MatSnackBarModule } from '@angular/material';
import { ReactiveFormsModule } from '@angular/forms';
import { PanelComponent } from './panel/panel.component';
import { CenteredSnackbarComponent } from './centered-snack-bar/centered-snack-bar.component';
import { TimePipe } from './time.pipe';

@NgModule({
  declarations: [
    AppComponent,
    CalcComponent,
    PanelComponent,
    CenteredSnackbarComponent,
    TimePipe,
  ],
  entryComponents: [CenteredSnackbarComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

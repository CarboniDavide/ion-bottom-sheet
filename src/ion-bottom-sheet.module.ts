import { NgModule, ModuleWithProviders } from '@angular/core';
import { IonBottomSheetComponent } from './components/ion-bottom-sheet.component';
import { IonBottomSheetProvider } from './providers/ion-bottom-sheet-provider';


@NgModule({
  declarations: [ IonBottomSheetComponent ],
  exports: [ IonBottomSheetComponent ]
})
export class IonBottomSheetModule {
  static forRoot(): ModuleWithProviders<void> {
    return {
      ngModule: IonBottomSheetModule,
      providers: [ IonBottomSheetProvider ]
    };
  }
 }

# Ion 4 Bottom Sheet [(show in live demo)](https://carbonidavide.github.io/ion-bottom-sheet)

Bottom sheet component for Ionic 4.

# How to Install
```
  $ npm i ion-bottom-sheet --save
```

# Dependencies

 - hammerjs
 - @types/hammerjs

Install all by using:
```
$ npm i hammerjs --save
$ npm i @types/hammerjs
```

# API

## Inputs
  - `roundBorder: boolean` - Use round border style. Default value: `true`.
  - `roundBorderOnTop: boolean` - Remove round border style when state is on `top`. Default value: `true`.
  - `shadowBorder: boolean` - Use shadow border style. Default value: `true`.
  - `shadowBorderOnTop: boolean` - Remove shadow border style when state is on `top`. Default value: `true`.
  - `hideDragIcon: boolean` - Hide drag icon. Default value: `false`.
  - `hideDragIconOnTop: boolean` - Hide drag icon when state is on `top`. Default value: `false`.
  - `hideCloseButton: boolean` - Hide and disable close sheet button. Default value: `false`.
  - `hideCloseButtonOnTop: boolean` - Hide and disable close button when state is on `top`. Default value: `false`.
  - `hideSeparator: boolean` - Hide line seprator from sheet header. Default value: `false`.
  - `titleCentered: boolean` - Put header sheet title in the center. Default value: `false`.
  - `title: string` - Header sheet title content. Default value: `Header Title`.
  - `titleFamily: string` - Header sheet title font family. Default value: `inherit`.
  - `titleSize: string` -  Header sheet title font size. Default value: `20px`.
  - `hideTitle: boolean` - Remove title from sheet header. Default value: `false`.
  - `hideHeader: boolean` - Remove header from sheet. Default value: `false`.
  - `dockedHeight: number` - Height of the sheet when is placed in docked position. Default value: `200`.
  - `canBounce: boolean` - Determines whether the sheet should automatically bounce when gesture touch end. Default value: `true`.
  - `disableDrag: boolean` - Disables sheet drag. Default value: `false`.
  - `topDistance: number` - Distance from top of fully opened sheet. Default value: `0`.
  - `transition: string` - Specify custom css transition when bounce movement is enabled. Default value: `0.2s ease-out`.
  - `state: SheetState` - Current state of the sheet. Possible values are: SheetState.Bottom, SheetState.Docked, SheetState.Top. Default value: `SheetState.Docked`.
  - `minHeight: number` - Minimum height of the sheet when it is in bottom state. Default value: `0`.
  - `bounceDelta: number` - Bounce value to change sheet state. Default value: `30`.
  - `enableScrollContent: boolean` - Enable scroll content in all sheet state: Default value `true`.
  - `enableScrollContentOnlyOnTop: boolean` - Enable scroll content only when sheet state is top. Default value: `false`.
  - `enableShadowHeaderOnScrolling: boolean` - Use shadow css style in the top of content when scrolling. Default value: `true`.
  - `useSmoothScrolling: boolean` - Use css smooth style to scroll content. Default value: `true`.
  
  
# Demostration

![Davide Carboni - Ion Bottom Sheet](doc/images/ion-sheet-states.png?raw=true "Title")

# Integration and Usage
First, import the IonBottomSheetModule to your app:

```typescript
import { IonBottomSheetModule } from 'ion-bottom-sheet';

@NgModule({
  imports: [
    ...,
    IonBottomSheetModule
  ],
  ...
})
export class AppModule { }
```

Use it in your component template like this:

```html
<ion-content no-bounce>
    .....
<ion-content>

<ion-bottom-sheet 
    [(state)]="sheetState" 
    [minHeight]="minHeight" 
    [dockedHeight]="dockedHeight"
    [canBounce]="canBounce" 
    [topDistance]="topDistance"
    [hideCloseButton]="hideCloseButton"
    [hideDragIcon]="hideDragIcon"
    [roundBorderOnTop]="roundBorderOnTop"
    [disableDrag]="disableDrag"
    [transition]="transition"
  >
  .....
</ion-bottom-sheet>
```

# Issues

Actually sheet content don't support scrolling !

# License

The MIT License (MIT)

Copyright (c) 2020 Davide Carboni

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
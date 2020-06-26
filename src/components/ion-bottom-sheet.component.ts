import { Component, Input, ElementRef, Renderer2, Output, EventEmitter, AfterViewInit, OnChanges, SimpleChanges} from '@angular/core';
import { Platform, DomController} from '@ionic/angular';
import { SheetState } from './ion-bottom-sheet-state';
import * as Hammer from 'hammerjs';

const HTML_TEMPLATE = `
<ion-content id="ion-bottom-sheet">
  <div id="ion-bottom-sheet-header">
    <div id="drag-icon"></div>
    <div id="close-button-container"><div id="close-button" (click)="closeSheet()"></div></div>
  </div> 
  <div id="ion-bottom-sheet-content">
    <ng-content></ng-content>
  </div>
</ion-content>
`;
 
const CSS_STYLE = `
  :host  {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    z-index: 11 !important;
    background-color: white;
    transform: translateY(110%);
    padding: 5px !important;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    transition: none;
    will-change: transform;
    box-shadow: 0px 4px 16px  rgba(0, 0, 0, 0.12);
  }

  #ion-bottom-sheet-header{
    position: fixed;
    background-color: white;
    width: 100%;
    z-index: 888;
  }

  #drag-icon{
    margin: 0 auto;
    height: 5px;
    width: 36px;
    background-color: #c0c0c0;
    border-radius: 4px;
  }
  
  #close-button-container{
    width: 100%;
    position: relative;
    height: 36px;
  }

  #close-button{
    width: 26px;
    height: 26px;
    position: absolute;
    background: #c0c0c0;
    right: 15px;
    border-radius: 100%;
    content: url('data:image/svg+xml; utf8, <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <path fill="7a7a7e" d="M278.6 256l68.2-68.2c6.2-6.2 6.2-16.4 0-22.6-6.2-6.2-16.4-6.2-22.6 0L256 233.4l-68.2-68.2c-6.2-6.2-16.4-6.2-22.6 0-3.1 3.1-4.7 7.2-4.7 11.3 0 4.1 1.6 8.2 4.7 11.3l68.2 68.2-68.2 68.2c-3.1 3.1-4.7 7.2-4.7 11.3 0 4.1 1.6 8.2 4.7 11.3 6.2 6.2 16.4 6.2 22.6 0l68.2-68.2 68.2 68.2c6.2 6.2 16.4 6.2 22.6 0 6.2-6.2 6.2-16.4 0-22.6L278.6 256z"/> </svg>');
  }

  #ion-bottom-sheet-content{
    touch-action: none;
    overflow: hidden;
    margin-top: 40px
  }

  #ion-bottom-sheet.drag-icon-disabled  #drag-icon,
  #ion-bottom-sheet.close-button-disabled #close-button-container{
    display: none !important;
  }

  #ion-bottom-sheet.drag-icon-disabled #close-button{
    top: 5px;
  }

  #ion-bottom-sheet.drag-icon-disabled #ionic-bottom-sheet-content{
    margin-top: 30px;  
  }

  #ion-bottom-sheet.close-button-disabled #ionic-bottom-sheet-content{
    margin-top: 15px;  
  }

  #ion-bottom-sheet.close-button-disabled.drag-icon-disabled #ionic-bottom-sheet-content{
    margin-top: 0px;  
  }

  #ion-bottom-sheet.close-button-disabled.drag-icon-disabled #ionic-bottom-sheet-header{
    display: none;  
  }
`;
 
@Component({
  selector: 'ion-bottom-sheet',
  template: HTML_TEMPLATE,
  styles: [CSS_STYLE]
})
export class IonBottomSheetComponent implements AfterViewInit, OnChanges {
  @Input() dockedHeight = 50;
  @Input() canBounce = true;
  @Input() roundBorderOnTop = true;
  @Input() disableDrag = false;
  @Input() hideCloseButton = false;
  @Input() hideDragIcon = false;
  @Input() topDistance = 0;
  @Input() transition = '0.1s ease-in-out';
  @Input() state: SheetState = SheetState.Bottom;
  @Input() minHeight = 0;
  @Output() stateChange: EventEmitter<SheetState> = new EventEmitter<SheetState>();

  private readonly _BOUNCE_DELTA = 30;
  private _startPosition: number;
  private _hasBorderRoundStyle: boolean = this.roundBorderOnTop;
    
  constructor(
    private _element: ElementRef,
    private _renderer: Renderer2,
    private _domCtrl: DomController,
    private _platform: Platform,
  ) { }

  /*********************************************************************************************************/
  /* Ng interface implements */
  /*********************************************************************************************************/

  ngAfterViewInit() {
    // define new events when animation start and stop
    this._element.nativeElement.addEventListener("transitionend", this._changeBorder.bind(this));

    // define css style
    this._setCss("close-button-disabled", this.hideCloseButton ? "add" : "remove", "#ion-bottom-sheet");
    this._setCss("drag-icon-disabled", this.hideDragIcon ? "add" :  "remove", "#ion-bottom-sheet");

    if (this.disableDrag) { return; }

    // config gesture
    const hammer = new Hammer(this._element.nativeElement);
    hammer.get('pan').set({ enable: true, direction: Hammer.DIRECTION_VERTICAL });
    hammer.on('pan panstart panend', (ev: any) => {

      switch (ev.type) {
        case 'panstart':
          this._onGestureStart();
          break;
        case 'panend':
          this._onGestureEnd(ev);
          break;
        default:
          this._onGestureMove(ev);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes.state) { return; }
    this._setSheetState(changes.state.currentValue);
  }

  /*********************************************************************************************************/
  /* Base class methods                                                                                    */
  /*********************************************************************************************************/

  private _setSheetState(state: SheetState) {
    this._setStyle('transition', this.transition);
    switch (state) {
      case SheetState.Bottom:
        this._setTranslateY('calc(100vh - ' + this.minHeight + 'px)');
        break;
      case SheetState.Docked:
        this._setTranslateY('calc(100vh - ' + this.dockedHeight + 'px)');
        break;
      case SheetState.Top:
        this._setTranslateY(this.topDistance + 'px');
        break;
    }
  }
  
  private _getPosition(currentState: SheetState): number{
    switch (currentState) {
      case SheetState.Bottom:
        return this._platform.height() - this.minHeight;
      case SheetState.Docked:
        return this._platform.height() - this.dockedHeight;
      case SheetState.Top:
        return this.topDistance;
    }
  }

  private _nextSate(currentState: SheetState, gestureDirection: number): number{
    switch (currentState) {
      case SheetState.Bottom:
        return gestureDirection < 0 ? SheetState.Docked : SheetState.Bottom;
      case SheetState.Docked:
        return gestureDirection < 0 ? SheetState.Top : SheetState.Bottom;
      case SheetState.Top:
        return gestureDirection < 0 ? SheetState.Top : SheetState.Docked;
    }
  }

  private _changeBorder(){
    if (!this.roundBorderOnTop) { return; }

    if (this._element.nativeElement.getBoundingClientRect().y == this._getPosition(SheetState.Top)){
      if (!this._hasBorderRoundStyle) { return; }
      this._hasBorderRoundStyle = false;
      this._setStyle('border-top-left-radius', '0px');
      this._setStyle('border-top-right-radius', '0px');
    }else{
      if (this._hasBorderRoundStyle) { return; }
      this._hasBorderRoundStyle = true;
      this._setStyle('border-top-left-radius', '10px');
      this._setStyle('border-top-right-radius', '10px');
    }
  }

  private _setCss(className, action: ("add" | "remove"), selector = null){
    this._domCtrl.write(() => {
      switch (action) {
        case "add":
          selector == null ? this._renderer.addClass(this._element.nativeElement, className) : this._renderer.addClass(this._element.nativeElement.querySelector(selector), className);
          break;
        case "remove":
          selector == null ? this._renderer.removeClass(this._element.nativeElement, className) : this._renderer.removeClass(this._element.nativeElement.querySelector(selector), className);
          break;
        default:
          return;
      }
    });
  }

  private _setStyle(property, value, selector = null){
    this._domCtrl.write(() => {
      if (selector != null) {
        this._renderer.setStyle(this._element.nativeElement.querySelector(selector), property, value);
      }else{
        this._renderer.setStyle(this._element.nativeElement, property , value);
      }
    });
  }

  private _setTranslateY(value) {
    this._setStyle('transform', 'translateY(' + value + ')');
  }

  /*********************************************************************************************************/
  /* Gestures                                                                                              */
  /*********************************************************************************************************/

  private _onGestureStart(){
    this._setStyle('transition', 'none');
    this._startPosition = this._element.nativeElement.getBoundingClientRect().y;
  }

  private _onGestureEnd(ev){
    if (this.canBounce == false) { return; }

    if ( Math.abs(ev.deltaY) > this._BOUNCE_DELTA){
      this.stateChange.emit(this.state = this._nextSate(this.state, ev.deltaY));
    }else{
      this._setStyle('transition', this.transition);
      this._setTranslateY(this._getPosition(this.state) + "px");
    }
  }

  private _onGestureMove(ev){
    let nextYposition = this._startPosition + ev.deltaY;

    if ( (nextYposition <= this._getPosition(SheetState.Top) ) && (ev.deltaY < 0) ){
      nextYposition = this._getPosition(SheetState.Top);
    }

    if ((nextYposition >= this._getPosition(SheetState.Bottom)) && (ev.deltaY > 0)){
      nextYposition = this._getPosition(SheetState.Bottom);
    }
    
    this._setTranslateY(nextYposition + "px");
    this._changeBorder();
  }

  /*********************************************************************************************************/
  /* Button's action                                                                                       */
  /*********************************************************************************************************/

  closeSheet(){
    this.stateChange.emit(this.state = SheetState.Bottom);
  }
}
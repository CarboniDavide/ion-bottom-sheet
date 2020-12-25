import { Component, Input, ElementRef, Renderer2, Output, EventEmitter, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { Platform, DomController} from '@ionic/angular';
import { SheetState } from './ion-bottom-sheet-state';
import * as Hammer from 'hammerjs';

const HTML_TEMPLATE = `
<div id="ibs-header" class="separator">
  <div id="ibs-header-content">
    <div id="drag-icon"></div>
    <div id="title-button">
      <div id="title">{{ title }}</div>
      <div id="close-button" (click)="closeSheet()"></div>
    </div>
  </div> 
</div>
<div id="ibs-content">
  <ng-content></ng-content>
</div>
`;
 
const CSS_STYLE = `
:host  {
  touch-action: none;
  padding: 5px;
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  z-index: 999 !important;
  background-color: white;
  transition: none;
  will-change: transform;
}

:host.round-border {
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
}

:host.shadow-border {
  box-shadow: 0px 4px 16px  rgba(0, 0, 0, 0.12);
}

:host #ibs-header{
  position: fixed;
  top:0;
  left:0;
  padding: 5px;
  width: 100%;
  z-index: 888;
  min-height: 35px;
}

:host .separator{
  border-bottom-style: solid;
  border-bottom-color: rgba(220, 220, 220, 1);
  border-bottom-width: 1px;
}

:host .bottom-shadow-border{
  box-shadow: 0px 3px 3px  rgba(0, 0, 0, 0.12);
}

:host #ibs-header-content{
  background-color: inherit;
  width: 100%;
  height: 100%;
}

:host #drag-icon{
  margin: 0 auto;
  height: 5px;
  width: 36px;
  background-color: #c0c0c0;
  border-radius: 4px;
}

:host #title-button{
  width: 100%;
  height: 100%;
  position: relative;
  height: 26px;
  margin-top: 5px;
  margin-bottom: 5px;
}

:host #close-button{
  width: 26px;
  height: 26px;
  position: absolute;
  right: 10px;
  background: #c0c0c0;
  border-radius: 100%;
  content: url('data:image/svg+xml; utf8, <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <path fill="7a7a7e" d="M278.6 256l68.2-68.2c6.2-6.2 6.2-16.4 0-22.6-6.2-6.2-16.4-6.2-22.6 0L256 233.4l-68.2-68.2c-6.2-6.2-16.4-6.2-22.6 0-3.1 3.1-4.7 7.2-4.7 11.3 0 4.1 1.6 8.2 4.7 11.3l68.2 68.2-68.2 68.2c-3.1 3.1-4.7 7.2-4.7 11.3 0 4.1 1.6 8.2 4.7 11.3 6.2 6.2 16.4 6.2 22.6 0l68.2-68.2 68.2 68.2c6.2 6.2 16.4 6.2 22.6 0 6.2-6.2 6.2-16.4 0-22.6L278.6 256z"/> </svg>');
}

:host #title{
  position: absolute;
  left: 10px;
  padding: 0px;
  margin: 0px;
  font-size: 20px;
  line-height: 26px;
  color: inherit; 
}

:host .txt-center{
  text-align: center;
  width: 100%;
  left: 0px !important;
}

:host #ibs-content{
  touch-action: none;
  overflow: hidden;
  margin-top: 45px
}

:host .fadeOut {
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s linear 700ms, opacity 700ms;  
}

:host .fadeIn {
  visibility: visible;
  opacity: 1;
  transition: visibility 0s linear 0s, opacity 300ms;
}

:host #tb-content {
  position: relative;
}

:host.no-drag-icon #drag-icon,
:host.no-close-btn #close-button,
:host.no-title #title,
:host.no-header #ibs-header {
  display: none !important;
}

:host.no-title #title-button {
  margin-top: 0px;
}

:host.no-title.no-drag-icon #title-button {
  margin-top: 5px;
}

:host.no-title #ibs-content {
  margin-top: 40px;
}

:host.no-drag-icon #ibs-content {
  margin-top: 40px;
}

:host.no-header #ibs-content {
  margin-top: 0px !important;
}

:host.no-drag-icon.no-title #ibs-content {
  margin-top: 40px;
}

:host.no-title.no-close-btn #title-button {
  margin-bottom: 0px;
}

:host.no-title.no-close-btn #ibs-content {
  margin-top: 35px;
}

:host.no-drag-icon.no-title.no-close-btn #title-button {
  margin-top: 0px;
  margin-bottom: 0px;
}

:host.no-drag-icon.no-title.no-close-btn #ibs-content {
  margin-top: 30px;
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
  @Input() roundBorder = true;
  @Input() roundBorderOnTop = false;
  @Input() shadowBorder = true;
  @Input() shadowBorderOnTop = false;
  @Input() disableDrag = false;
  @Input() hideCloseButton = false;
  @Input() hideCloseButtonOnTop = false;
  @Input() hideDragIcon = false;
  @Input() hideDragIconOnTop = false;
  @Input() hideTitle = false;
  @Input() hideHeader = false;
  @Input() hideSeparator = false;
  @Input() titleCentered = false;
  @Input() titleSize = "20px";
  @Input() titleFamily = "inherit";
  @Input() topDistance = 0;
  @Input() transition = '0.1s ease-in-out';
  @Input() state: SheetState = SheetState.Bottom;
  @Input() minHeight = 0;
  @Input() title = "Header Title";

  @Output() stateChange: EventEmitter<SheetState> = new EventEmitter<SheetState>();

  private readonly _BOUNCE_DELTA = 30;
  private _startPosition: number;
  private _hasBeenPerformed: Boolean = false;
    
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
    this._element.nativeElement.addEventListener("transitionend", this._checkForAnimation.bind(this));

    // define css style
    this._cssManageClass("no-close-btn", this.hideCloseButton ? "add" : "remove");
    this._cssManageClass("no-drag-icon", this.hideDragIcon ? "add" : "remove");
    this._cssManageClass("no-title", this.hideTitle ? "add" : "remove");
    this._cssManageClass("no-header", this.hideHeader ? "add" : "remove");
    this._cssManageClass("separator", this.hideSeparator ? "remove" : "add", "#ibs-header");
    this._cssManageClass("round-border", this.roundBorder ? "add" : "remove");
    this._cssManageClass("shadow-border", this.shadowBorder ? "add" : "remove");
    this._cssManageClass("txt-center", this.titleCentered ? "add" : "remove", "#title");
    this._setStyle("font-size", this.titleSize, "#title");
    this._setStyle("font-family", this.titleFamily, "#title");

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

  private _checkForAnimation(){

    if (this._element.nativeElement.getBoundingClientRect().y == this._getPosition(SheetState.Top)){
      if (this._hasBeenPerformed) { return; }
      this._hasBeenPerformed = true;
    }else{
      if (!this._hasBeenPerformed) { return; }
      this._hasBeenPerformed = false;
    }
    
    if (!this.roundBorderOnTop && this.roundBorder) {
      this._cssManageClass("round-border", this._hasBeenPerformed ? "remove" : "add", null);
    }
    
    if (!this.shadowBorderOnTop && this.shadowBorder) {
      this._cssManageClass("shadow-border", this._hasBeenPerformed ? "remove" : "add", null);
    }

    if (this.hideDragIconOnTop && !this.hideDragIcon) {
      this._cssSwitchClass(this._hasBeenPerformed ? "fadeOut" : "fadeIn", this._hasBeenPerformed ? "fadeIn" : "fadeOut", "#drag-icon");
    }

    if (this.hideCloseButtonOnTop && !this.hideCloseButton) {
      this._cssSwitchClass(this._hasBeenPerformed ? "fadeOut" : "fadeIn", this._hasBeenPerformed ? "fadeIn" : "fadeOut", "#close-button");
    }
  }

  private _cssSwitchClass(entryClassName, exitClassName, selector) {
    this._renderer.removeClass(this._element.nativeElement.querySelector(selector), exitClassName);
    this._renderer.addClass(this._element.nativeElement.querySelector(selector), entryClassName);
  }

  private _cssManageClass(className, action: ("add" | "remove"), selector = null){
    this._domCtrl.write(() => {
      action == "add" ? this._cssAddClass(className, selector) : this._cssRemoveClass(className, selector)
    });
  }

  private _cssAddClass(className, selector = null){
    this._domCtrl.write(() => {
      this._renderer.addClass(selector == null ? this._element.nativeElement : this._element.nativeElement.querySelector(selector), className);
    });
  }

  private _cssRemoveClass(className, selector = null){
    this._domCtrl.write(() => {
      this._renderer.removeClass(selector == null ? this._element.nativeElement : this._element.nativeElement.querySelector(selector), className);
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
    this._checkForAnimation();
  }

  /*********************************************************************************************************/
  /* Button's action                                                                                       */
  /*********************************************************************************************************/

  closeSheet(){
    this.stateChange.emit(this.state = SheetState.Bottom);
  }
}
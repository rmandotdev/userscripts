export const addCss = () =>
  GM_addStyle(`
.sandwhich-settings-trigger-button {
    position: absolute; /* Position relative to the nearest positioned ancestor (the modal, if styled correctly) */
    bottom: -50px;
    right: 0px;
    padding: 10px 15px;
    background-color: #f0e68c; /* Khaki-like color */
    color: #333;
    border: 1px solid #ccc;
    border-radius: 5px;
    border-width: 2px;
    cursor: pointer;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
    font-size: 14px;
    font-weight: bold;
    user-select: none;
}
.sandwhich-settings-trigger-button:hover {
    background-color: #e8db7f; /* Slightly lighter */
    border-color: #b8ae6b;  /* Slightly darker */
}


.sandwhich-settings-container {
    height: 90%;
    overflow-y: auto;
    animation: none !important;
}
.sandwhich-setting-section {
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
}
.sandwhich-setting-section:last-child {
    border-bottom: none;
}


.sandwhich-setting-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}
.sandwhich-setting-header h3 {
    margin: 0;
    font-size: 1.1em;
    color: #fff614;
}
.sandwhich-setting-description {
    font-size: 0.9em;
    color: #a7a7a7;
    margin-bottom: 15px;
    line-height: 1.2;
}
.sandwhich-inputs-container {
    margin-top: 10px;
    padding-left: 15px; /* Indent inputs slightly */

    transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out,
                padding-top 0.3s ease-in-out, padding-bottom 0.3s ease-in-out,
                margin-top 0.3s ease-in-out;
    overflow: hidden;
}
.sandwhich-inputs-container.sandwhich-inputs-collapsed {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
}
.sandwhich-input-row {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    flex-wrap: wrap; /* Allow wrapping on small screens */
}
 .sandwhich-input-row label:first-child {
    margin-right: 10px;
    font-weight: bold;
    min-width: 200px; /* Align input elements */
    flex-shrink: 0;
}
.sandwhich-input-row input[type="color"],
.sandwhich-input-row input[type="number"],
.sandwhich-input-row select {
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 3px;
    margin-right: 10px;
}
.sandwhich-input-row input[type="number"] {
   width: 60px;
}
.sandwich-input-row input[type="color"] {
    min-width: 40px;
    height: 30px;
    padding: 2px;
}
.sandwhich-input-description {
    font-size: 0.85em;
    color: #777;
    margin: 5px 0 0 20px;
    flex-basis: 100%;
    line-height: 1.3;
}

.sandwhich-toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
    margin-left: 10px;
}
.sandwhich-toggle-switch.small {
     width: 40px;
     height: 20px;
}
.sandwhich-toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}
.sandwhich-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
}
.sandwhich-toggle-switch.small .sandwhich-slider {
     border-radius: 20px;
}
.sandwhich-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%; /* Make it a circle */
}
.sandwhich-toggle-switch.small .sandwhich-slider:before {
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
}

input:checked + .sandwhich-slider {
    background-color: #2196F3;
}
input:checked + .sandwhich-slider:before {
    transform: translateX(26px); /* Move circle to the right */
}
.sandwhich-toggle-switch.small input:checked + .sandwhich-slider:before {
    transform: translateX(20px); /* Move circle for small switch */
}




#select-box.sandwhich-select-box {
  /* disable neals default styles */
  border-color: transparent !important;
  background-color: transparent !important;
}

/* pseudo-element */
#select-box.sandwhich-select-box::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border: var(--sandwhich-sel-border);
  background-color: var(--sandwhich-sel-background);
  animation: var(--sandwhich-sel-chroma-animation);
}


body.sandwhich-sel-active .instance-selected {
  border: transparent !important;
  background-color: transparent !important;

  scale: var(--sandwhich-sel-scale);
}

/* pseudo-element for selected instances when mod is active */
body.sandwhich-sel-active .instance-selected::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;

  border: var(--sandwhich-sel-border);
  background-color: var(--sandwhich-sel-background);
  animation: var(--sandwhich-sel-chroma-animation);
  border-radius: inherit;
}


@keyframes sandwhich-chromaCycleBorder {
  0%  { border-color: rgb(255, 0,   0  ); } /* Red */
  10% { border-color: rgb(255, 127, 0  ); } /* Orange */
  20% { border-color: rgb(255, 255, 0  ); } /* Yellow */
  30% { border-color: rgb(127, 255, 0  ); } /* Lime */
  40% { border-color: rgb(0,   255, 0  ); } /* Green */
  50% { border-color: rgb(0,   255, 255); } /* Aqua */
  60% { border-color: rgb(0,   127, 255); } /* Light Blue */
  70% { border-color: rgb(0,   0,   255); } /* Blue */
  80% { border-color: rgb(127, 0,   255); } /* Purple */
  90% { border-color: rgb(255, 0,   255); } /* Magenta */
  100%{ border-color: rgb(255, 0,   127); } /* Pink */
}
@keyframes sandwhich-chromaCycleBackground {
  0%  { background-color: rgba(255, 0,   0,   0.3); } /* Red */
  10% { background-color: rgba(255, 127, 0,   0.3); } /* Orange */
  20% { background-color: rgba(255, 255, 0,   0.3); } /* Yellow */
  30% { background-color: rgba(127, 255, 0,   0.3); } /* Lime */
  40% { background-color: rgba(0,   255, 0,   0.3); } /* Green */
  50% { background-color: rgba(0,   255, 255, 0.3); } /* Aqua */
  60% { background-color: rgba(0,   127, 255, 0.3); } /* Light Blue */
  70% { background-color: rgba(0,   0,   255, 0.3); } /* Blue */
  80% { background-color: rgba(127, 0,   255, 0.3); } /* Purple */
  90% { background-color: rgba(255, 0,   255, 0.3); } /* Magenta */
  100%{ background-color: rgba(255, 0,   127, 0.3); } /* Pink */
}
@keyframes sandwhich-rotateBorder {
  100% { transform: rotate(360deg); }
}



#sandwhich-tab-container {
    position: absolute;
    top: 5px;
    display: flex;
    align-items: start;
    padding: 5px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 100;
}
#sandwhich-tab-list {
    display: flex;
    align-items: center;
    overflow: auto;
    pointer-events: auto;
}
.sandwhich-tab, .sandwhich-tab-add-button {
    user-select: none;
    display: flex;
    background-color: color-mix(in srgb, var(--sandwhich-tab-color) 25%, #000 75%);
    color: #ccc;
    border: none;
    font-size: 15px;
    cursor: pointer;
    border-radius: 5px;
    padding: 10px;
    margin-left: 3px;
    margin-right: 3px;
    max-width: 200px;
    flex-shrink: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: auto;
}
.sandwhich-tab.active {
    background-color: color-mix(in srgb, var(--sandwhich-tab-color) 60%, #000 40%);
    color: #fff;
}
.sandwhich-tab:not(.active):hover, .sandwhich-tab-add-button:hover {
    background-color: color-mix(in srgb, var(--sandwhich-tab-color) 40%, #000 60%);
}
.sandwhich-tab.drag-over {
    box-shadow: inset 0 0 0 2px #77aaff;
}



@keyframes slideIn {
    from {
        transform: translateX(-100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
#sandwhich-tab-contextmenu {
    position: absolute;
    background-color: #333;
    color: #ccc;
    border: 1px solid #555;
    border-radius: 5px;
    padding: 5px;
    z-index: 1000;
}
.sandwhich-tab-contextmenu-option {
    padding: 5px;
    cursor: pointer;
}
.sandwhich-tab-contextmenu-option:hover {
    background-color: #444;
    color: #ddd;
}
.sandwhich-tab-contextmenu-option.delete {
    color: indianred;
}





.recipe-modal-subtitle:not(.sandwhich-unicode-info-expanded) {
    opacity: 0.7;
	  cursor: pointer;
	  text-decoration: underline dotted;
    user-select: none;
}
.recipe-modal-subtitle.sandwhich-unicode-info-expanded {
    font-family: monospace;
    white-space: pre-wrap;
    user-select: text;
}
.recipe-modal-subtitle:hover {
	  opacity: 1;
}

.sandwhich-unicode-items {
	line-height: .5em;
	background-color: var(--sidebar-bg);
	position: relative;
	border-bottom: 1px solid var(--border-color);
	flex-shrink: 0;
}
.sandwhich-unicode-header {
  display: flex;
  align-items: center;
  padding: 10px 10px 0px 10px;
}
.sandwhich-unicode-checkbox {
    appearance: none; /* Remove default styling */
    width: 16px;
    height: 16px;
    margin-right: 10px;
    border: 2px solid var(--border-color);
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    position: relative;
    background-color: #000; /* Background color when unchecked */
    transition: background-color 0.2s ease;
}
.sandwhich-unicode-checkbox:checked {
    border-color: #FFBF00;
}
.sandwhich-unicode-checkbox:checked::after {
    content: '';
    display: block;
    position: absolute;
    /* Position the checkmark */
    top: 2px;
    left: 5px;
    width: 4px;
    height: 8px;

    /* Create the checkmark shape using borders */
    border: solid #FFBF00;
    border-width: 0 2px 2px 0;

    transform: rotate(45deg);
}




.sandwhich-unicode-header-label {

}
.sandwhich-unicode-items-inner {
	  padding: 9px;
	  display: flex;
    flex-wrap: wrap;
}
.sandwhich-unicode-showall {
    opacity: 0.7;
	  cursor: pointer;
	  text-decoration: underline dotted;
    user-select: none;
    align-self: center;
    padding: 10px;
    padding-left: 20px;
    padding-right: 20px;
}
.sandwhich-unicode-showall:hover {
	  opacity: 1;
}
`);

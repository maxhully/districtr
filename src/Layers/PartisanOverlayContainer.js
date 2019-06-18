import { html } from "lit-html";
import { Parameter } from "../components/Parameter";
import select from "../components/select";
import { toggle } from "../components/Toggle";
import PartisanOverlay from "./PartisanOverlay";
import { getLayerDescription } from "./OverlayContainer";
import { getPartyRGBColors } from "./color-rules";
import { actions } from "../reducers/elections";
import { bindAll } from "../utils";

export default class PartisanOverlayContainer {
    constructor(layers, elections) {
        this.elections = elections;
        this.layers = layers;
        this.electionOverlays = elections.map(
            election => new PartisanOverlay(layers, election)
        );
        this._currentElectionIndex = 0;

        bindAll(
            ["setElection", "render", "toggleVisibility", "updateElection"],
            this
        );
    }
    get currentElectionOverlay() {
        return this.electionOverlays[this._currentElectionIndex];
    }
    toggleVisibility(visible) {
        this.isVisible = visible;
        if (this.isVisible) {
            this.currentElectionOverlay.show();
        } else {
            this.currentElectionOverlay.hide();
        }
    }
    updateElection(i) {
        this._currentElectionIndex = i;
        this.electionOverlays.forEach(overlay => overlay.hide());
        if (this.isVisible) {
            this.electionOverlays[this._currentElectionIndex].show();
        }
    }
    setElection(i, dispatch) {
        this.updateElection(i);
        dispatch(actions.changeElection({ index: i }));
    }
    render(uiState, dispatch) {
        const currentIndex = uiState.elections.activeElectionIndex;
        if (currentIndex !== this._currentElectionIndex) {
            this.updateElection(currentIndex);
        }
        const overlay = this.electionOverlays[currentIndex];
        return html`
            <h4>Partisanship</h4>
            <div class="ui-option ui-option--slim">
                ${toggle(`Show partisan lean`, overlay.isVisible, checked =>
                    this.toggleVisibility(checked)
                )}
            </div>
            ${[
                {
                    label: "Election:",
                    element: select(
                        "election-overlay",
                        this.elections,
                        i => this.setElection(i, dispatch),
                        currentIndex
                    )
                },
                {
                    label: "Display as",
                    element: select(
                        "layer-type",
                        this.layers.map(layer => getLayerDescription(layer)),
                        i =>
                            this.electionOverlays.forEach(overlay =>
                                overlay.setLayer(i)
                            )
                    )
                }
            ].map(Parameter)}
            ${CategoricalLegend(overlay.election)}
        `;
    }
}

function cssRGB(rgb) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function CategoricalLegend(election) {
    return html`
        <details>
            <summary>Legend</summary>
            ${election.parties.map(party =>
                Parameter({
                    label: html`
                        <span
                            class="part-number"
                            style="background: ${cssRGB(
                                getPartyRGBColors(party.name)
                            )}"
                        ></span>
                    `,
                    element: party.name
                })
            )}
        </details>
    `;
}

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Favourites from './favourites/Favourites.js';
import Search from './search/Search.js';
import { sidebarSelector as mapStateToProps } from '../../selectors/selectors';
import classNames from 'classnames';
import currentWindowService from '../../services/currentWindowService';

import { selectFavourites, selectSearch } from '../../actions/sidebar';
import { selectStock, unselectStock } from '../../actions/selection';
import { toggleFavourite, insertFavouriteAt } from '../../actions/favourites';

import windowStateShape from '../../propTypeShapes/windowState';
import selectionShape from '../../propTypeShapes/selection';
import favouritesShape from '../../propTypeShapes/favourites';

class Sidebar extends Component {
    constructor(props) {
        super(props);
        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.addActive = this.addActive.bind(this);
        this.removeActive = this.removeActive.bind(this);
        this.focusFav = this.focusFav.bind(this);
        this.focusSearch = this.focusSearch.bind(this);
        this.toggleFavourite = this.toggleFavourite.bind(this);
        this.selectStock = this.selectStock.bind(this);

        this.state = { draggingFromAnotherWindow: false };
    }

    onDragEnter(e) {
        const dragStartWindow = this.getWindowFromDT(e.dataTransfer.types);

        if (dragStartWindow !== currentWindowService.getCurrentWindowName()) {
            this.addActive();
        }
    }

    onDragOver(e) {
        if (!e.defaultPrevented) {
            e.preventDefault();
        }
    }

    onDragLeave(e) {
        if (e.target === e.currentTarget) {
            this.removeActive();
        }
    }

    onDrop(e) {
        const code = this.getCodeFromDT(e.dataTransfer.types);
        const codes = this.props.favourites.codes;
        if (!codes.includes(code)) {
            this.props.dispatch(insertFavouriteAt(codes.length, code));
        }
        this.removeActive();
    }

    /*
     * DataTransfer.getData is only available in dragstart, drop and dragEnd
     * We can get around that by adding our data to DataTransfer.types
     * Each element of the types array is stringified JSON
     * */
    getCodeFromDT(types) {
        for (let i = 0; i < types.length; i++) {
            const dataTransferObj = JSON.parse(types[i]);
            if (Object.keys(dataTransferObj)[0] === 'code') {
                return dataTransferObj.code.toUpperCase();
            }
        }
        return undefined;
    }

    getWindowFromDT(types) {
        for (let i = 0; i < types.length; i++) {
            const dataTransferObj = JSON.parse(types[i]);
            if (Object.keys(dataTransferObj)[0] === 'window') {
                return dataTransferObj.window;
            }
        }
        return undefined;
    }

    addActive() {
        if (!this.state.draggingFromAnotherWindow) {
            this.setState({ draggingFromAnotherWindow: true });
        }
    }

    removeActive() {
        if (this.state.draggingFromAnotherWindow) {
            this.setState({ draggingFromAnotherWindow: false });
        }
    }

    focusFav() {
        if (!this.props.sidebar.showFavourites) {
            this.props.dispatch(selectFavourites());
        }
    }

    focusSearch() {
        if (!this.props.sidebar.showSearch) {
            this.props.dispatch(selectSearch());
        }
    }

    toggleFavourite(stockCode) {
        this.props.dispatch(toggleFavourite(stockCode));

        const isFavourite = this.props.favourites.codes.some(favourite => favourite === stockCode);
        if (this.props.selection.code === stockCode && isFavourite) {
            if (this.props.favourites.codes.length >= 2) {
                const newStockCode = this.props.favourites.codes.find(favourite => favourite !== stockCode);
                const newStockName = this.props.favourites.names[newStockCode];
                this.props.dispatch(selectStock(newStockCode, newStockName));
            } else {
                this.props.dispatch(unselectStock());
            }
        }
    }

    selectStock(stockCode, stockName) {
        if (!this.props.windowState.isCompact) {
            this.props.dispatch(selectStock(stockCode, stockName));
        }
    }

    render() {
        const { sidebar } = this.props;

        let bindings = {
            toggleFavourite: this.toggleFavourite,
            selectStock: this.selectStock,
            getCodeFromDT: this.getCodeFromDT
        };

        const sidebarsCls = classNames({
            active: this.state.draggingFromAnotherWindow
        });

        const searchCls = classNames({
            expanded: sidebar.showSearch,
            contracted: sidebar.showFavourites
        });

        const favouritesCls = classNames({
            expanded: sidebar.showFavourites,
            contracted: sidebar.showSearch
        });

        return (
            <div className={`sidebars ${sidebarsCls}`} onDragEnter={this.onDragEnter} onDragOver={this.onDragOver} onDragLeave={this.onDragLeave} onDrop={this.onDrop}>
                <div className={`search main-search ${searchCls}`} onClick={this.focusSearch}>
                    <Search bindings={bindings} />
                </div>
                <div className={`search compact-search ${searchCls}`} onClick={this.focusSearch}>
                    <Search bindings={bindings} />
                </div>
                <div className={`favourites ${favouritesCls}`} onClick={this.focusFav}>
                    <Favourites bindings={bindings} />
                </div>

                <div className="closed-window-selection">
                    <closed-window-list icon="'closed_tabs'"></closed-window-list>
                </div>
            </div>
        );
    }
}
Sidebar.propTypes = {
    dispatch: PropTypes.func.isRequired,
    sidebar: PropTypes.object.isRequired,
    windowState: windowStateShape.isRequired,
    selection: selectionShape.isRequired,
    favourites: favouritesShape.isRequired
};

export default connect(mapStateToProps)(Sidebar);

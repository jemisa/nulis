import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { browserHistory } from 'react-router';

/* Vendor */
import Mousetrap from 'mousetrap';
import { Modal } from 'react-bootstrap';
import removeMd from 'remove-markdown';

import saveAs from 'save-as'
import FileReaderInput from 'react-file-reader-input';

/* Actions */
import * as actions from '../actions/index';
import {fetchUser, logout} from '../actions/profiles';
import { ActionCreators } from 'redux-undo';
var { undo, redo } = ActionCreators;

/* My Components */
import LoginForm from './LoginForm';
import PaymentsModal from './PaymentsModal';
import TreeSettingsForm from './TreeSettingsForm';

class Header extends Component {
    constructor(props){
	super(props);
	/* Bind functions to this */
	this.renderTemplatesList = this.renderTemplatesList.bind(this);	

	this.saveFile = this.saveFile.bind(this);
	this.loadFile = this.loadFile.bind(this);

	this.state = { showModal: false };

	this.showModal = this.showModal.bind(this);
    }

    showModal(show){
	this.setState({ showModal: show });
    }
    
    componentDidMount(){
	this.props.fetchUser();
	console.log("plan " + this.props.user.plan);
	/* Shortcuts */
	Mousetrap(document.body).bind(['ctrl+s'], ()=>{
	    this.saveFile();
	    return false;
	});
	Mousetrap(document.body).bind(['ctrl+o'], ()=>{
	    this.refs.openFile.click();
	    return false;
	});
	Mousetrap(document.body).bind(['alt+n'], ()=>{
	    this.props.loadTemplate('Blank');
	    return false;
	});
	/* Focus on search */
	Mousetrap(document.body).bind(['ctrl+/'], ()=>{
	    console.log("focus!");
	    ReactDOM.findDOMNode(this.refs.search).focus();	    
	    return false;
	});
	
    }
    
    componentDidUpdate(pastProps, pastState) {
	/* If user has created a card - check if he's reached the limit.*/
	if (this.props.tree.cards != pastProps.tree.cards
	    && this.props.location.pathname != "/trees") {

	    /* If unauthenticated user reached a limit - open must login prompt. */
	    if(this.props.authenticated == false
	       && localStorage.getItem('cardsCreated') > 100){
		this.showModal("mustLogin");
	    }

	    /* If free user reached a limit - open upgrade prompt. */
	    if (this.props.user.plan == "Free"
		&& localStorage.getItem('cardsCreated') > 200){
		this.showModal("upgrade");
	    }
	}
    }

    /* Opening and saving files */
    loadFile(e, results){
	/* Get file contents from the magical component */
	var [e, file] = results[0];
	const contents = e.target.result;
	console.log(JSON.stringify(file.name));
	/* Parse file, turn it into json tree */
	const tree = JSON.parse(contents);
	if (!tree.name) {
	    tree.name = file.name.slice(0, -4);
	}
	/* console.log(`Successfully loaded ${JSON.stringify(tree)}!`);*/
	/* Replace my state with it */
	this.props.setTree(tree);
	browserHistory.push('/file/'+tree.name);
    }    
    saveFile(event) {
	if (event) {
	    event.preventDefault();
	}
	/* Take my tree from state and stringify it */
	var tree = this.props.tree;
	tree.modified = false;
	if (!tree.name) {
	    /* Generate tree name if there isn't any */
	    var firstCard = tree.cards.children[0];
	    var firstLine = firstCard.content.split('\n')[0];
	    tree.name = removeMd(firstLine).substring(0,40);
	}
	var contents = JSON.stringify(tree, null, 4);
	/* Use magical component to save it into a file */
	var blob = new Blob([contents],
			    { type: 'application/json;charset=utf-8' });
	var filename = tree.name+'.nls';
	saveAs(blob, filename);
    }
    
    renderTemplatesList() {
	var templates = ['Story'];
	templates = templates.map((t)=>{
	    return (
		<li key={t}>
		    <a onClick={()=>this.props.loadTemplate(t)}>
		       {t}
		   </a>
		</li>
	    );
	});
	var hr = [ <hr key="hr-templates"/> ]
	return templates;
    }

    renderCardLimit() {
	var cardsCreated = 0;
	if (localStorage.getItem('cardsCreated')) {
	    cardsCreated = localStorage.getItem('cardsCreated');
	}

	if (this.props.authenticated == false) {
	    /* If the user isn't logged in - opens must login prompt. */
	    return (
		<div className="progress-outer"
		     onClick={()=>this.showModal("mustLogin")}>
		    <div className="progress-inner"
			 style={{"width" : `${cardsCreated}%`}}>
		    </div>
		</div>		    
	    )
	}
	if (this.props.user.plan == "Free") {
	    /* Making sure user is on Free account,
	       opening upgrade prompt.*/
	    return (
		<div className="progress-outer"
		     onClick={()=>this.showModal("upgrade")}>
		    <div className="progress-inner"
			 style={{"width" : `${cardsCreated/2}%`}}>
		    </div>
		</div>		    
	    )
	}
    }
    render() {
	const atMyTrees = this.props.location.pathname == "/trees";
	const isDesktop = window.__ELECTRON_ENV__ == 'desktop';
	
	return (
	    <div className="header">
		<PaymentsModal show={this.state.showModal =="upgrade" ? true : false}
			       onHide={()=>this.showModal(false)}
			       showModal={this.showModal}/>

		<Modal className="tree"
		       show={this.state.showModal =="tree" ? true : false}
		       onHide={()=>this.showModal(false)}>
		    <Modal.Header closeButton>
			<h1>Tree Settings</h1>
		    </Modal.Header>
		    <TreeSettingsForm showModal={this.showModal}/>
		</Modal>
		
		<Modal className="support"
		       show={this.state.showModal =="support" ? true : false}
		       onHide={()=>this.showModal(false)}>
		    <Modal.Header closeButton>
			<h1>Support</h1>
		    </Modal.Header>
		    <div className="panel-modal">
			<p>Hey there! If you have any questions, feedback, or bug reports, feel free to send me an email to <b>raymestalez@gmail.com</b>.
			</p>
		    </div>
		</Modal>

		<Modal className="desktop"
		       show={this.state.showModal =="desktop" ? true : false}
		       onHide={()=>this.showModal(false)}>
		    <Modal.Header closeButton>
			<h1>Download Nulis Desktop</h1>
		    </Modal.Header>
		    <div className="panel-modal">
			<p>Desktop version of Nulis is now available for
			    all the platforms! <br/>
			    Awesome, right? =) </p>
			<div className="panel-download">
			    <a href="/downloads/Nulis-linux-x64.zip"
			       className="btn btn-primary right">Download</a>
			    <h2 className="fullheight">Linux</h2>
			    <div className="clearfix"></div>			    
			</div>

			<div className="panel-download">
			    <a href="/downloads/Nulis-darwin-x64.zip"
			       className="btn btn-primary right">Download</a>
			    <h2>Mac</h2>
			    <p> (Untested. Message me to report bugs.) </p>
			    <div className="clearfix"></div>			    
			</div>

			<div className="panel-download">
			    <a href="/downloads/Nulis-win32-x64.zip"
			       className="btn btn-primary right">Download</a>
			    <h2>Windows</h2>
			    <p> (Untested. Message me to report bugs.) </p>    
			    <div className="clearfix"></div>
			</div>

	
		<div className="clearfix"></div>
		    </div>
		</Modal>
		
		<Modal show={(this.state.showModal == "login"
			   || this.state.showModal == "join") ? true : false}
		       onHide={()=>this.showModal(false)}>
	               <LoginForm type={this.state.showModal}
	                          showModal={this.showModal}/>
		</Modal>

		<Modal show={this.state.showModal == "mustLogin" ? true : false}
		       onHide={()=>this.showModal(false)}>
		    <LoginForm type={this.state.showModal}
			       showModal={this.showModal}
			       mustLogin={true}/>
		</Modal>

		

		<div className="main-menu">
		    <div className="left">
			<Link to={"/"}>
			    <div className="logo">
				N
			    </div>
			</Link>
			<span className="dropdown">
			    <a className="btn">Tree</a>
			    <ul className="dropdown-menu">
				<li key="new">
				    <a onClick={()=> {
					    this.props.loadTemplate('Blank');
					    browserHistory.push('/new');
					}}>
					<i className="fa fa-plus"></i>
					New Tree
				    </a>
				</li>
				{this.props.authenticated?
				 <li key="trees" className={(atMyTrees ? "hidden":"")}>
				     <Link to="/trees">
					 <i className="fa fa-th"></i>
					 My Trees
				     </Link>
				 </li>
				 : null}
	        {/* Show "Save Online" if I'm the author, or it's a template. */}
		{this.props.authenticated 
	         && (localStorage.getItem('email')==this.props.tree.author
		     || !this.props.tree.author) ?
		<li key="saveonline"
		    className={(atMyTrees ? "hidden":"")}>
		    <a onClick={()=>
					 this.props.saveTree(this.props.tree) }>
			<i className="fa fa-cloud"></i>
			Save Online
		    </a> 
		</li>
		 : null}
		<li key="open">
		    <a  onClick={()=>this.refs.openFile.click()}>
			<i className="fa fa-folder-open-o"></i>
			Open File...
		    </a> 
		</li>
		<li key="save" className={(atMyTrees ? "hidden":"")}>
		    <a onClick={this.saveFile}>
			<i className="fa fa-hdd-o"></i>
			Save File...
		    </a> 
		</li>			    
		<hr/>
		<li key="templates" className="disabled">
		    <a  onClick={this.saveFile}>
			Templates:
		    </a> 
		</li>			    
		{ this.renderTemplatesList() }
			    </ul>
			</span>		    
			<span className={"dropdown " + (atMyTrees ? "hidden":"")}>
			    <a className="btn">Edit</a>
			    <ul className="dropdown-menu">
				<li key="undo">
				    <a  onClick={()=>this.props.undo()}>
					Undo
					<span className="label label-default right">
					    Ctrl+Z
					</span>
				    </a> 
				</li>
				<li key="redo">
				    <a  onClick={()=>this.props.redo()}>
					Redo
					<span className="label label-default right">
					    Ctrl+Shift+Z
					</span>
				    </a> 
				</li>
				<li key="delete">
				    <a onClick={()=>this.props.deleteCard()}>
					Delete Card
					<span className="label label-default right">
					    Ctrl+Bksp
					</span>
				    </a>
				</li>
				<hr/>
				{/* Show tree settings only to the author */}
				{this.props.authenticated
				 && localStorage.getItem('email')==
				     this.props.tree.author ?
				<li key="settings">
				    <a onClick={()=>this.showModal("tree")}>
					Tree Settings
				    </a> 
				</li>
				: null}
				<hr/>
				<li className="hidden" key="prefs">
				    <a  onClick={this.saveFile}>
					Nulis Preferences
				    </a> 
				</li>
			    </ul>
			</span>
			<span className="dropdown">
			    <a className="btn">Profile</a>
			    {this.props.authenticated?
			     <ul className="dropdown-menu">
				 <li className="hidden" key="accountprefs">
				     <a onClick={this.props.logout}>
					 Preferences
				     </a>
				 </li>
				 {this.props.user.plan == "Free" ?
				 <li  className="" key="upgrade">
				     <a  onClick={()=>this.showModal("upgrade")}>
					 Upgrade Account
				     </a>
				 </li> : null}
				 <hr/>
				 <li key="logout">
				     <a onClick={this.props.logout}>
					 Logout
				     </a>
				 </li>
			     </ul>
			     :
			     <ul className="dropdown-menu">
				 <li key="login">
				     <a onClick={()=>this.showModal("login")}>
					 Login
				     </a>
				 </li>
				 <li key="join">
				     <a onClick={()=>this.showModal("join")}>
					 Create Account
				     </a>
				 </li>
			     </ul>
			    }
			</span>

			<span className="dropdown">
			    <a className="btn">About</a>
			    <ul className="dropdown-menu">
				<li key="about">
				    <a onClick={()=>{
					    this.props.loadTemplate("About");
					    browserHistory.push('/about');
					}}>
					About Nulis</a>
				</li>
				<li key="desktop" className={" "+(isDesktop ? "hidden":"")}>
				    <a onClick={()=>this.showModal("desktop")}>
					Nulis Desktop</a>
				</li>
				<li key="support">
				    <a onClick={()=>this.showModal("support")}>
					Contact Support
				    </a>
				</li>
				<li key="subreddit">
				    <a href="https://www.reddit.com/r/nulis"
				       target="_blank">
					Subreddit
				    </a>
				</li>
			    </ul>
			</span>
			{/* End left */}
		    </div>

		    {atMyTrees ?
		     <h1>My Trees</h1>
		     :
		     /* Show tree settings only if I'm the author. */
		     this.props.authenticated
		     && localStorage.getItem('email')== this.props.tree.author ?
		     <a onClick={()=>this.showModal("tree")}>
			 <h1>{this.props.tree.name}</h1>
		     </a>
		     :
		     /* Otherwise just show the name. */
		     <h1>{this.props.tree.name}</h1>
		    }
			{/* End main menu */}		
		</div>


		<div className={"stats " + (atMyTrees ? "hidden":"")}>
		    <span className="autosaved">
			{this.props.tree.saved ? "Saved" : "" }
		    </span>

		    {this.renderCardLimit()}
		    <input className="search" ref="search"
			   value={this.props.tree.query}
			   onChange={(event)=>
			       this.props.updateSearchQuery(event.target.value)}/>
		    <i className="fa fa-search"/>
		</div>
		<div className="right debugging-header">
		    {/* <a className="btn" onClick={this.createTree}>New</a> */}

		    <p className="grey">Active Card Id:</p>
		    <p className="small">
			{this.props.tree.activeCard}
		    </p>
		    <p className="grey">Modified:</p>
		    <p className="small">
			{this.props.tree.modified}
		    </p>
		    <p className="grey">Debugging:</p>
		    <p className="small"
		       dangerouslySetInnerHTML={{__html: this.props.tree.debugging }}>
		    </p>
		    <p className="grey">State:</p>
		    <pre className="small hidden">
			{JSON.stringify(this.props.tree, null, 4)}
		    </pre>
		</div>


		<div className="clearfix"></div>
		{/* Magical invisible component that opens and parses files
		    purely on frontend */}
		<div  style={{display: "none"}}>
		    <FileReaderInput as="text" onChange={this.loadFile}>
			<li key="open">
			    <a  ref="openFile"></a>
			</li>		    
		    </FileReaderInput>			
		</div>
	    </div>
	);
    }
}


function mapStateToProps(state) {
    return {
	tree: state.tree.present,
	allTrees: state.allTrees,
	authenticated: state.profiles.authenticated,
	user: state.profiles.user
    };
}

export default connect(mapStateToProps, {...actions, fetchUser, logout, undo, redo})(Header);

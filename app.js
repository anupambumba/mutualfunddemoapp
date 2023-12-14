'use strict';

const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const readExcel = require('read-excel-file/node');
const session = require('express-session');
const excelReadWrite = require('exceljs');


app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

app.use(session({
	secret: 'AnupamSessionSecret',
	resave: true,

	saveUninitialized: true
}));

router.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/public/html/index.html'));
	//__dirname : It will resolve to your project folder.
});
router.post('/loginUser', function(req, res) {
	req.session.register = undefined;
	req.session.password = undefined;


	var userName = req.body.userName;
	var password = req.body.password;
	var loggedInUser = '';
	var usermatched = false;
	var callStatus = '';
	var errorType = '';
	readExcel('./database/UserDetails.xlsx').then((data) => {
		for (let i = 1; i < data.length; i++) {
			var currentUserName = data[i][2];
			var currentPassword = data[i][3];

			if (currentUserName == userName) {
				if (currentPassword == password) {
					usermatched = true;
					loggedInUser = data[i][0] + ' ' + data[i][1];
					callStatus = 'success'
					req.session.loggedInUser = loggedInUser;
					req.session.loggedInUserName = currentUserName;




				} else {
					usermatched = false;
					errorType = 'Password';



				}
				break;
			} else {
				usermatched = false;


			}

		}
		if (callStatus == '') {
			if (errorType == '') {
				errorType = 'UserName';
			}

			callStatus = 'failure ::: ' + errorType;

		}

		res.send(callStatus);
	});






});

router.post('/getSessionMessage', function(req, res) {
	var sessionKeyValue = req.body.sessionKey;
	var valueToBeRetruned = '';

	if (sessionKeyValue == 'loggedInUser') {

		var valueToBeReturned = req.session.loggedInUser;

		if (valueToBeReturned != undefined) {
			valueToBeRetruned = { 'message': valueToBeReturned, 'type': ' Message' };
		} else {

			req.session.unAuthAccess = 'You are not authorized.Please login first';
		}

	} else if (sessionKeyValue == 'unAuthAccess') {
		valueToBeRetruned = { 'message': req.session.unAuthAccess, 'type': ' Error' };

	} else if (sessionKeyValue == 'firstPage') {
		var message = '';
		var registerMessage = req.session.register;
		var passwordMessage = req.session.password;
		var logoutMessage = req.session.logout;

		if (registerMessage != undefined) {
			message = registerMessage;
		}
		if (passwordMessage != undefined) {
			message = passwordMessage;
		}
		if (logoutMessage != undefined) {
			message = logoutMessage;
		}
		valueToBeRetruned = { 'message': message, 'type': ' Message' };
	} else if (sessionKeyValue == 'availableValue') {
       
		var availableValue = req.session.availableValue;
		var freshLogin = true;
		if (availableValue == undefined) {
			availableValue = 5000;
			req.session.availableValue = 5000;

		}
      
		if (req.session.datasaved == true) {
			freshLogin = false;
			req.session.datasaved = false;
		}
		valueToBeRetruned = { 'message': availableValue, 'text': 'Data is successfully stored.','type': ' Message', 'freshLogin': freshLogin };
	} else if (sessionKeyValue == 'sellMessage') {

		if (req.session.sellMessage != undefined) {
			var sellMessage = req.session.sellMessage;
			valueToBeRetruned = { 'message': sellMessage, 'type': ' Message' };
			req.session.sellMessage = undefined;
		} else {
			var sellMessage = '';
			valueToBeRetruned = { 'message': sellMessage, 'type': ' Message' };

		}

	}

	res.send(valueToBeRetruned);
});

router.post('/registerUser', function(req, res) {
	var firstName = req.body.firstName;
	var lastName = req.body.lastName;
	var userName = req.body.userName;
	var password = req.body.password;
	var secretQues = req.body.secretQues;
	var sectAnswer = req.body.sectAnswer;
	var userAlreadyExsits = false;

	var finalResponse = '';
	var workbook = new excelReadWrite.Workbook();
	// var worksheet = workbook.getWorksheet("Sheet1");
	workbook.xlsx.readFile('database/UserDetails.xlsx')
		.then(function() {
			var worksheet = workbook.getWorksheet("Sheet1");

			worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
				if (rowNumber > 1) {
					if (userAlreadyExsits == false) {

						var loopUserName = row.values[3];
						if (loopUserName != undefined) {
							loopUserName = loopUserName.trim();
						}
						var userEnteredUserName = userName.trim();

						if (loopUserName == userEnteredUserName) {
							userAlreadyExsits = true;

						}
					}
				}


			});

			if (userAlreadyExsits == false) {


				worksheet.columns = [
					{ header: 'First Name', key: 'firstName', width: 15 },
					{ header: 'Last Name', key: 'lastName', width: 15 },
					{ header: 'User Name', key: 'userName', width: 15, },
					{ header: 'Password', key: 'password', width: 15 },
					{ header: 'Secret Question', key: 'secretQues', width: 30 },
					{ header: 'Secret Answer', key: 'sectAnswer', width: 30, }
				];
				worksheet.addRow({ firstName: firstName, lastName: lastName, userName: userName, password: password, secretQues: secretQues, sectAnswer: sectAnswer });
				workbook.xlsx.writeFile('database/UserDetails.xlsx').then(function() {
					finalResponse = { status: 'success' };
					req.session.register = 'User is successfully Registered';
					req.session.password = undefined;
					res.send(finalResponse);

				}).catch(function(err) {
					finalResponse = { 'status': 'error', 'errorMessage': 'There is some technical issue.Please try after some time.' };
					res.status(500).send(finalResponse);



				});



			} else {

				finalResponse = { 'status': 'failure', 'errorMessage': 'User already exists in the System.Choose different UserName or Try to Reset password for existing user.' };
				res.send(finalResponse);
			}


		}).catch(function(err) {
			finalResponse = { 'status': 'error', 'errorMessage': 'There is some technical issue.Please try after some time.' };
			res.status(500).send(finalResponse);


		});






});

router.post('/searchUserDetails', function(req, res) {
	var userName = req.body.userName.trim();
	var searchResponse = '';
	readExcel('./database/UserDetails.xlsx').then((data) => {

		for (let i = 1; i < data.length; i++) {
			if (searchResponse == '') {
				var currentUserName = data[i][2].trim();
				if (userName == currentUserName) {
					var currentUserQuestion = data[i][4].trim();
					var currentUserAnswer = data[i][5].trim();
					searchResponse = { 'question': currentUserQuestion, 'answer': currentUserAnswer, 'rowId': i };

				}

			}
		}
		res.send(searchResponse);
	});

});
router.post('/passwordChange', function(req, res) {
	var newPassword = req.body.newPassword;
	var rowId = req.body.rowId;
	var workbook = new excelReadWrite.Workbook();
	var statusOfUpdate = '';
	workbook.xlsx.readFile('database/UserDetails.xlsx')
		.then(function() {

			var worksheet = workbook.getWorksheet("Sheet1");
			var rowToBeModified = worksheet.getRow(rowId);

			rowToBeModified.getCell(4).value = newPassword;
			rowToBeModified.commit();
			workbook.xlsx.writeFile('database/UserDetails.xlsx').then(function() {
				statusOfUpdate = { 'status': 'success' };
				req.session.register = undefined;

				req.session.password = 'Password is successfully reseted.';
				res.send(statusOfUpdate);


			}).catch(function(err) {
				statusOfUpdate = { 'status': 'error' };
				res.status(500).send(statusOfUpdate);


			});



		}).catch(function(err) {
			statusOfUpdate = { 'status': 'error' };
			res.status(500).send(statusOfUpdate);


		});


});
router.post('/getUserMutualFundData', function(req, res) {

	var userName = req.session.loggedInUserName;

	var mutualFundRespone = [];

	readExcel('./database/MutualFundData.xlsx').then((data) => {

		for (let i = 1; i < data.length; i++) {
			var loopUserName = data[i][0];
			var status = data[i][6].trim();

			if (loopUserName == userName && status == "A") {
				var currentValue = data[i][3] * data[i][5];
				var fundDivName = data[i][1].replace(/ /g, "_");
				var actualDate = new Date(data[i][2]);
				const options = { month: "short" };
				var purchaseDate = actualDate.getDate() + "-" + new Intl.DateTimeFormat("en-US", options).format(actualDate.getMonth()) + "-" + actualDate.getFullYear();
				var loopResponse = { 'userName': data[i][0], 'fundName': data[i][1], 'fundDivName': fundDivName, 'purchaseDate': purchaseDate, 'purchaseUnit': data[i][3], 'amountInvested': data[i][4], 'currentRate': data[i][5], 'currentValue': currentValue, 'currentLoopValue': i+1 };
				mutualFundRespone.push(loopResponse);



			} else {
				continue;
			}
		}

		res.send(mutualFundRespone);
	}).catch(function(err) {



	});

});
router.post('/currentMutualFundData', function(req, res) {

	var userName = req.session.loggedInUserName;

	var mutualFundRespone = [];

	readExcel('./database/AvaiableFunds.xlsx').then((data) => {

		for (let i = 1; i < data.length; i++) {



			var loopResponse = { 'availableFundName': data[i][0], 'availableFundValue': data[i][1] };
			mutualFundRespone.push(loopResponse);




		}

		res.send(mutualFundRespone);
	}).catch(function(err) {



	});

});
router.post('/purchaseCardData', function(req, res) {
	var workbook = new excelReadWrite.Workbook();

	var availableFundNameArr = req.body.availableFundNameArr;
	var availableFundValueArr = req.body.availableFundValueArr;
	var purchaseQtyArr = req.body.purchaseQtyArr;
	var userName = req.session.loggedInUserName;
	var finalResponse = '';
	var purchaseDate = new Date().toString();
	workbook.xlsx.readFile('database/MutualFundData.xlsx')
		.then(function() {
			var worksheet = workbook.getWorksheet("Sheet1");
			worksheet.columns = [
				{ header: 'User Name', key: 'userName', width: 15 },
				{ header: 'Fund Name', key: 'fundName', width: 30 },
				{ header: 'Purchase Date', key: 'purchaseDate', width: 15 },
				{ header: 'Purchase Unit', key: 'purchaseUnit', width: 15 },
				{ header: 'Amount Invested', key: 'amountInvested', width: 30 },
				{ header: 'Current Unit Rate', key: 'currentUnitRate', width: 30 },
				{ header: 'Status', key: 'status', width: 15 }
			];
			for (var i = 0; i < availableFundNameArr.length; i++) {

				var availableFundName = availableFundNameArr[i];
				var availableFundValue = availableFundValueArr[i];
				var purchaseQty = purchaseQtyArr[i];
				var amountInvested = purchaseQty * availableFundValue;
				var availableValue = req.session.availableValue;
				var balanceFund = availableValue - amountInvested;

				req.session.availableValue = balanceFund;
				req.session.datasaved = true;
				
				
				worksheet.addRow({ userName: userName, fundName: availableFundName, purchaseDate: purchaseDate, purchaseUnit: parseInt(purchaseQty.trim()), amountInvested: amountInvested, currentUnitRate: availableFundValue, status: "A" });
			}
			workbook.xlsx.writeFile('database/MutualFundData.xlsx').then(function() {
				finalResponse = { status: 'success' };

				res.send(finalResponse);

			}).catch(function(err) {
				console.log(err);
				finalResponse = { 'status': 'error', 'errorMessage': 'There is some technical issue.Please try after some time.' };
				res.status(500).send(finalResponse);



			});

		}).catch(function(err) {
			console.log(err);
			finalResponse = { 'status': 'error', 'errorMessage': 'There is some technical issue.Please try after some time.' };
			res.status(500).send(finalResponse);

		});




});
router.post('/sellProduct', function(req, res) {
	var rowId = req.body.rowId;
	var workbook = new excelReadWrite.Workbook();
	var statusOfUpdate = '';
	
	workbook.xlsx.readFile('database/MutualFundData.xlsx')
		.then(function() {

			var worksheet = workbook.getWorksheet("Sheet1");
			var rowToBeModified = worksheet.getRow(rowId);

			rowToBeModified.getCell(7).value = "I";
			rowToBeModified.commit();
			workbook.xlsx.writeFile('database/MutualFundData.xlsx').then(function() {
				statusOfUpdate = { 'status': 'success' };
				req.session.register = undefined;

				req.session.sellMessage = 'Product is successfully sold';
				res.send(statusOfUpdate);


			}).catch(function(err) {
				statusOfUpdate = { 'status': 'error' };
				res.status(500).send(statusOfUpdate);


			});



		}).catch(function(err) {
			statusOfUpdate = { 'status': 'error' };
			res.status(500).send(statusOfUpdate);


		});


});

router.post('/logoutUser', function(req, res) {
	req.session.loggedInUser = undefined;
	req.session.loggedInUserName = undefined;
	req.session.availableValue = undefined;
	var finalResponse = '';
	if (req.session.loggedInUser == undefined) {
		finalResponse = { status: 'success' };
		req.session.logout = 'You have been successfully logged out.';
	} else {
		finalResponse = { 'status': 'error', 'errorMessage': 'There is some technical issue.Please try after some time.' }
	}
	res.send(finalResponse);
});
router.get('/register', function(req, res) {
	res.sendFile(path.join(__dirname + '/public/html/register.html'));
	//__dirname : It will resolve to your project folder.
});
router.get('/forgetPassword', function(req, res) {
	res.sendFile(path.join(__dirname + '/public/html/forgetPassword.html'));
	//__dirname : It will resolve to your project folder.
});

//add the router
app.use('/', router);
app.use('/public', express.static(__dirname + '/public'));




console.log('Running at Port 8500');


module.exports = app;
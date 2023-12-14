var mutualFundModuleApp = angular.module('mutualFundModuleApp', ['ngRoute']);
mutualFundModuleApp.config(function($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: '/public/html/index.html',
			controller: 'mutualFundController'
		})
		.when('/loginPage', {
			templateUrl: '/public/html/home.html',
			controller: 'mutualFundController'
		});
});


mutualFundModuleApp.controller("mutualFundController", function($scope, $http, $window) {


	$http.post('/getSessionMessage', {
		'sessionKey': 'unAuthAccess'

	}).then(function(response) {
		var dataRetruned = response.data;

		if (dataRetruned.type.trim() == 'Error') {

			$scope.errorMessage = dataRetruned.message;

		}

	});

	$http.post('/getSessionMessage', {
		'sessionKey': 'firstPage'

	}).then(function(response) {
		var dataRetruned = response.data;

		if (dataRetruned.type.trim() == 'Message') {

			$scope.infoMessage = dataRetruned.message;
		}

	});











	$scope.submitMutualFundForm = function() {


		$http.post('/loginUser', {
			userName: $scope.user.userName,
			password: $scope.user.password
		}).then(function(response) {
			var callStatus = response.data;

			if (callStatus == 'success') {
				$window.location.href = '/public/html/home.html';


			} else {

				var errorElement = (callStatus.split(':::'))[1].trim();
				var errorMessage = '';

				if (errorElement == 'UserName') {
					errorMessage = 'User Name is not valid';
				} else if (errorElement == 'Password') {
					errorMessage = 'Password is not valid';
				} else {
					errorMessage = 'There is some technical issue';
				}
				$scope.errorMessage = errorMessage;
				$scope.infoMessage = '';

				$window.location.replace = '/public/html/index.html';
			}



		});

	};



});

mutualFundModuleApp.controller("homePageController", function($scope, $http, $window) {
	$scope.homePage = {};
	$scope.availableFundNameArr = [];
	$scope.availableFundValueArr = [];
	$scope.purchaseQtyArr = [];
	$http.post('/getSessionMessage', {
		'sessionKey': 'loggedInUser'

	}).then(function(response) {
		var dataRetruned = response.data;

		if (dataRetruned != '') {
			if (dataRetruned.type.trim() == 'Message') {

				$scope.userName = dataRetruned.message;
			} else if (dataRetruned.type.trim() == 'Error') {


				$window.location.href = '/public/html/index.html';

			}

		} else {
			$window.location.href = '/public/html/index.html';
		}


	});
	$http.post('/getSessionMessage', {
		'sessionKey': 'availableValue'

	}).then(function(response) {
		var dataRetruned = response.data;
		
		if (dataRetruned != '') {
			
			if (dataRetruned.type.trim() == 'Message') {
           
				$scope.homePage.availableValue = dataRetruned.message;
				console.log("dataRetruned.freshLogin ::: "+dataRetruned.freshLogin);
				if(dataRetruned.freshLogin==false){
					
					//$scope.infoMessage = dataRetruned.text;
					$('#infoMSgSection').html(dataRetruned.text);
					//$scope.errorMessage = dataRetruned.text;
				}
				
				
			}
			
		}

		


	});
	$http.post('/getSessionMessage', {
		'sessionKey': 'sellMessage'

	}).then(function(response) {
		var dataRetruned = response.data;
		if (dataRetruned != '') {
			
			if (dataRetruned.type.trim() == 'Message') {
              
				$scope.infoMessage = dataRetruned.message.trim();
				}
				
				
			}
			
		
	});
	$http.post('/getUserMutualFundData', {}).then(function(response) {
		var dataRetruned = response.data;
		$scope.mutualFundData = dataRetruned;

	});

	$http.post('/currentMutualFundData', {}).then(function(response) {
		var dataRetruned = response.data;
		$scope.currentMutualFundData = dataRetruned;


	});
	

	$scope.initiatteCheckoutChange = function(index) {
		
		var checkBoxStatus = $("#currentFund_" + index).is(":checked");
		if (checkBoxStatus == true) {
			$('#currentFundQty_' + index).prop('disabled', false);
			$('#addToCartImage_' + index).prop('style', 'display:block');
		} else {
			$('#currentFundQty_' + index).prop('disabled', true);
			$('#addToCartImage_' + index).prop('style', 'display:none');
		}


	};
	
	
	$scope.logoutUser = function() {
		$http.post('/logoutUser', {}).then(function(response) {
			var dataRetruned = response.data;
			if (dataRetruned.status = 'success') {
				$window.location.href = '/public/html/index.html';
			} else {
				$window.location.replace = '/public/html/index.html';
			}


		}).catch(function(error) {
			$window.location.replace = '/public/html/index.html';


		});
	};

	$scope.checkoutDetails = function(availableFund, index) {
		
		var availableFundName = availableFund.availableFundName;
		var availableFundValue = availableFund.availableFundValue;
		var currentFundQty = $("#currentFundQty_" + index).val();
		if (currentFundQty == undefined) {
			currentFundQty = 0;
		}

		var availableFund = $scope.homePage.availableValue;
		if (availableFund == undefined) {
			availableFund = 5000;
		}
		var currentPurchaseAmount = availableFundValue * currentFundQty;
		
		if (currentFundQty == 0) {
			$scope.errorMessage = "Please select quantity to add to the cart.";
		} else {
			if (availableFund > currentPurchaseAmount) {
				$scope.selectedIndex = index;
				var balanceFund = availableFund - currentPurchaseAmount;
				$scope.homePage.availableValue = balanceFund;
				var currentItem = availableFundName + " of " + currentFundQty + " quantity @ " + availableFundValue;
				$("#detailsOfCartItems").append('<li class="list-group-item">' + currentItem + '</li>');
				$('#currentFund_' + index).prop('disabled', true);
				$('#currentFundQty_' + index).prop('disabled', true);
				$('#addToCartImage_' + index).prop('style', 'display:none');
				$('#purchaseCartItems').prop('disabled', false);
				$scope.availableFundNameArr.push(availableFundName);
				$scope.availableFundValueArr.push(availableFundValue);
				$scope.purchaseQtyArr.push(currentFundQty);
				$scope.errorMessage = "";
				$http.post('/getUserMutualFundData', {}).then(function(response) {
					var dataRetruned = response.data;
					$scope.mutualFundData = dataRetruned;

				});
				


			} else {
				$scope.errorMessage = "You do not have sufficient fund to add the selected in cart.";
			}

		}



	};
	$scope.purchaseCartItems = function() {

		$http.post('/purchaseCardData', {
			availableFundNameArr: $scope.availableFundNameArr,
			availableFundValueArr: $scope.availableFundValueArr,
			purchaseQtyArr: $scope.purchaseQtyArr
		}).then(function(response) {
			var responseStatus = response.data.status;
			if (responseStatus == 'success') {
				$http.post('/getUserMutualFundData', {}).then(function(response) {
					var dataRetruned = response.data;
					$scope.mutualFundData = dataRetruned;
					
					var index = $scope.selectedIndex;
					$('#currentFund_' + index).prop('disabled', false);
					$('#currentFund_' + index).prop('checked', false);
					$('#purchaseCartItems').prop('disabled', true);
					$("#detailsOfCartItems").empty();
					$('#currentFundQty_' + index).prop('disabled', 'disabled');
					$('#currentFundQty_' + index).prop('value', 0);
					$('#addToCartImage_' + index).prop('style', 'display:none');
					$window.location.href = '/public/html/home.html';
					//$scope.infoMessage = 'Data is successfully stored.';

				});


			} else if (responseStatus == 'failure') {
				$window.location.relace = '/public/html/home.html';
				$scope.errorMessage = '';
				$scope.errorMessage = response.data.errorMessage;
			}


		}).catch(function(error) {
			$scope.errorMessage = error.data.errorMessage;
			$window.location.relace = '/public/html/home.html';


		});
	};
	
	
	$scope.sellProduct = function(rowId) {

		$http.post('/sellProduct', {
			rowId: rowId
		}).then(function(response) {
			
			var responseStatus = response.data.status;
			if (responseStatus == 'success') {
				
					
					$window.location.href = '/public/html/home.html';
					$scope.infoMessage = 'Product is scuucessfully sold.';

				


			} else if (responseStatus == 'error') {
				
				$scope.errorMessage = 'There is some Technical issue. Please try after some time.';
				$window.location.relace = '/public/html/home.html';
			}


		}).catch(function(error) {
			$scope.errorMessage = 'There is some Technical issue. Please try after some time.';
			$window.location.relace = '/public/html/home.html';


		});
	};

});
mutualFundModuleApp.controller("registrationPageController", function($scope, $http, $window) {
	$scope.registerUserForm = function() {
		var password = $scope.register.password.trim();
		var confirmPassword = $scope.register.confirmPassword.trim();
		if (password != confirmPassword) {
			$scope.errorMessage = $scope.errorMessage = 'Password and Enter Password are not matching. ';
			$window.location.relace = '/public/html/register.html';

		} else {
			$http.post('/registerUser', {
				firstName: $scope.register.firstName,
				lastName: $scope.register.lastName,
				userName: $scope.register.userName,
				password: $scope.register.password,
				secretQues: $scope.register.secretQues,
				sectAnswer: $scope.register.sectAnswer
			}).then(function(response) {
				var responseStatus = response.data.status;
				if (responseStatus == 'success') {
					$window.location.href = '/public/html/index.html';
				} else if (responseStatus == 'failure') {
					$window.location.relace = '/public/html/register.html';
					$scope.errorMessage = '';
					$scope.errorMessage = response.data.errorMessage;
				}


			}).catch(function(error) {
				$scope.errorMessage = error.data.errorMessage;
				$window.location.relace = '/public/html/register.html';


			});
		}


	};


});
mutualFundModuleApp.controller("forgetPasswordPageController", function($scope, $http, $window) {
	$scope.changePassword = function() {
		var newPassword = $scope.forgetPassword.newPassword.trim();
		var confirmNewPassword = $scope.forgetPassword.confirmNewPassword.trim();

		$scope.errorMessage = '';
		if (newPassword != confirmNewPassword) {
			$scope.errorMessage = 'New Password and Confirm New Password are not matching.Please try again.';
			$window.location.relace = '/public/html/forgetPassword.html';

		} else {

			$http.post('/passwordChange', {
				newPassword: newPassword,
				rowId: $scope.searchResultDeatils.rowId + 1
			}).then(function(response) {

				if (response.data.status == 'success') {

					$window.location.href = '/public/html/index.html';

				} else {
					$scope.errorMessage = 'There is some issue with the Password Reset Process. Please try after some time';
					$window.location.relace = '/public/html/forgetPassword.html';
				}

			}).catch(function(error) {
				$scope.errorMessage = 'There is some issue with the Password Reset Process. Please try after some time';
				$window.location.relace = '/public/html/forgetPassword.html';


			});


		}


	};
	$scope.searchUserDetails = function() {
		$scope.errorMessage = '';
		$http.post('/searchUserDetails', {
			userName: $scope.forgetPassword.userName
		}).then(function(response) {

			$scope.searchResultDeatils = response.data;
			if ($scope.searchResultDeatils != '') {
				$scope.secretQuestion = $scope.searchResultDeatils.question;
				$scope.forgetPassword.secretQuesSec = true;
				$scope.forgetPasswordUserNameDisable = true;
				$window.location.relace = '/public/html/forgetPassword.html';
			} else {
				$scope.errorMessage = 'Please enter a valid user name or try to register as new user';
				$window.location.relace = '/public/html/forgetPassword.html';
			}




		});

	};
	$scope.submitAnswer = function() {
		var secretQuesAns = $scope.forgetPassword.secretQuesAns;
		$scope.errorMessage = '';
		if ($scope.searchResultDeatils.answer.toLowerCase() == secretQuesAns.toLowerCase()) {

			$scope.forgetPassword.changePasswordSec = true;
			$scope.forgetPasswordSecretAnswerDisable = true;
			$window.location.relace = '/public/html/forgetPassword.html';


		} else {
			$scope.errorMessage = 'Your Secret Answer is not Matching.Please enter valid answer';
			$window.location.relace = '/public/html/forgetPassword.html';
		}


	};


});
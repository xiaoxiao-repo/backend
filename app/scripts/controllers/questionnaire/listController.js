define(function(require, exports, module) {
	var Helper = require("helper");
	var baseController = require('baseController');
	var bC = new baseController();
	var template = require('template');
	var QuestionnaireService = require('QuestionnaireService');
	var StatisticsBox = require("scripts/controllers/questionnaire/StatisticsBox");
	var Pagination = require('lib.Pagination');

	var orgId = Application.organization.id;
	var limit, page;

	var Controller = function() {
		var controller = this;
		controller.namespace = "questionnaire.list";
		controller.actions = {
			search: function() {
				var btn = this;
				keyword = btn.parents(".search-box").find(".keyword-name").val();
				Helper.begin(btn);
				page = 1;
				controller.render(function() {
					Helper.end(btn);
				});
			},
			// 删除问卷
			remove: function() {
				var _btn = this;
				var questionnaireId = _btn.attr("data-value");
				Helper.confirm("确定删除该问卷调查？", function() {
					Helper.begin(_btn);
					QuestionnaireService.remove(questionnaireId).done(function(data) {
						Helper.successToast("删除成功！");
						_btn.parents("tr").slideUp(200, function() {
							$(this).remove();
							controller.render();
						});
					}).fail(function(error) {
						Helper.alert(error);
					}).always(function() {
						Helper.end(_btn);
					});
				});
			},
			// 切换问卷状态
			switchState: function() {
				var _input = this;
				var questionnaireId = _input.attr("data-value");
				var checked = _input.prop("checked");
				QuestionnaireService[checked ? "open" : "close"](questionnaireId).done(function(data) {
					Helper.successToast(checked ? "问卷已开启！" : "问卷已关闭！");
					if (checked) {
						_input.prop("checked", true);
					} else {
						_input.removeAttr("checked");
					}
				}).fail(function(error) {
					Helper.alert(error);
				});
			},
			// 查看统计
			checkStatistics: function() {
				var questionnaireId = this.attr("data-value");
				var statisticsBox = StatisticsBox(questionnaireId);
			}
		};
	};

	bC.extend(Controller);
	Controller.prototype.init = function() {
		limit = 10;
		keyword = "";
		page = +Helper.param.search('page') || 1;
		limit = +Helper.param.search('limit') || 10;

		this.render(this.callback);
	};

	Controller.prototype.render = function(callback) {
		var controller = this;
		var skip = (page - 1) * limit;
		QuestionnaireService.getList({
			organizationId: orgId,
			skip: skip,
			limit: limit,
			keyword: keyword
		}).done(function(data) {
			var questionnaires = data.result.data;
			var total = data.result.total;
			Helper.globalRender(template(controller.templateUrl, {
				pagination: Helper.pagination(total, limit, page),
				questionnaires: questionnaires,
				count: total,
				keyword: keyword
			}));

			Pagination(total, limit, page, {
				switchPage: function(pageIndex) {
					page = pageIndex;
					Application.loader.begin();
					controller.render(function() {
						Application.loader.end();
					});
				}
			});
			
		}).fail(function(error) {
			Helper.alert(error);
		}).always(function() {
			Helper.execute(callback);
		});
	}
	module.exports = Controller;
});
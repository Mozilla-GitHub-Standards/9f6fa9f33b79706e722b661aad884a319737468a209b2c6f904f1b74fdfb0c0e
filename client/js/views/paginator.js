App.Views.Paginator = App.Views.BaseView.extend({
  template: App.Templates.paginator,
  currentPage: 1,
  events: {
    "click .page": "handlePageClick",
    "click .previous": "handlePreviousClick",
    "click .next": "handleNextClick"
  },

  initialize: function(options) {
    _.bindAll(this, "createPageObject", "toggleLoading", "handlePageFetchSuccess");
    options = options || {};
    this.totalCount = options.totalCount || 0;
    // this.onBeforeFetch = $.noop;
    this.onBeforeFetch = options.onBeforeFetch || $.noop;
    // this.onAfterFetch = $.noop;
    this.onAfterFetch = options.onAfterFetch || $.noop;
    this.render();
  },

  render: function() {
    if (this.collection.isEmpty()) return;
    this.$el.html(this.template({
      pages: this.pages(),
      isNotFirstPage: this.currentPage !== 1,
      isNotLastPage: this.currentPage !== this.pageCount(),
    }));
    return this.$el;
  },

  pages: function() {
    return _.times(this.pageCount(), this.createPageObject);
  },

  createPageObject: function(i) {
    var num = i + 1;
    var className = this.currentPage === num ? "current" : "page";
    return {
      number: num,
      className: className
    };
  },

  pageCount: function() {
    return Math.ceil(this.totalCount / this.collection.perPage);
  },

  handlePageClick: function(e) {
    e.preventDefault();
    var pageLink = $(e.target);
    this.currentPage = pageLink.data().pageNumber;
    this.fetchPage();
  },

  handlePreviousClick: function(e) {
    e.preventDefault();
    this.currentPage -= 1;
    this.fetchPage();
  },

  handleNextClick: function(e) {
    e.preventDefault();
    this.currentPage += 1;
    this.fetchPage();
  },

  fetchPage: function() {
    this.toggleLoading();
    this.onBeforeFetch();
    this.collection.page = this.currentPage;
    this.collection.fetch()
      .done(this.handlePageFetchSuccess);
  },

  handlePageFetchSuccess: function() {
    this.render();
    this.onAfterFetch();
    this.toggleLoading();
  }
});

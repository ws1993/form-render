import React, { useEffect, useRef, useImperativeHandle } from 'react';
import { useForm } from 'form-render';
import { useUpdateEffect } from 'ahooks';

import { useTableStore } from './store';
import { _get, isFunction, isArray } from '../utils';
import { TableRenderProps } from '../types';

import ErrorBoundary from './ErrorBoundary';
import SearchView from './SearchView';
import ToolbarView from './ToolbarView';
import TableView from './TableView';

import './index.less';

type ISearchParams = {
  current?: number;
  tab?: number | string;
  pageSize?: number;
  sorter?: any;
};

const RenderCore: React.FC<TableRenderProps & { tableRef: any }> = props => {
  const {
    search: searchProps,
    debug, className,
    style,
    title,
    toolbarRender,
    toolbarAction,
    tableRef,
    request: api,
    size,
    tableWrapper,
    autoRequest = true,
    columns,
    onTabChange,
    ...tableProps
  } = props;

  const { hidden: hiddenSearch } = searchProps || { hidden: true };

  const form = useForm();
  const rootRef = useRef<HTMLDivElement>(null);

  const inited = useTableStore((state) => state.inited);
  const currentTab = useTableStore((state) => state.tab);
  const tableSize = useTableStore((state) => state.tableSize);
  const pagination = useTableStore((state) => state.pagination);
  const setState = useTableStore((state) => state.setState);
  const getState = useTableStore((state) => state.getState);
  const setColumns = useTableStore((state) => state.setColumns);

  useEffect(() => {
    const initState = {
      tableSize: size,
      inited: true,
      pagination
    };

    if (typeof tableProps?.pagination === 'object') {
      if (tableProps?.pagination?.current) {
        initState.pagination.current = tableProps.pagination.current;
      }
      if (tableProps?.pagination?.pageSize) {
        initState.pagination.pageSize = tableProps.pagination.pageSize;
      }
    }
    setState(initState);
  }, []);

  useEffect(() => {
    if (columns) {
      setColumns(columns);
    }
  }, [columns]);

  useEffect(() => {
    if (inited && hiddenSearch && autoRequest) {
      refresh();
    }
  }, [inited]);

  useUpdateEffect(() => {
    refresh();
  }, [currentTab])

  useImperativeHandle(tableRef, () => ({
    doSearch,
    refresh,
    changeTab,
    form,
    getState: () => ({
      ...getState(),
      search: form.getValues(true)
    }),
    setState,
  }));

  const fullScreen = () => {
    return Promise.resolve(rootRef.current?.requestFullscreen());
  };

  const doSearch = (params: ISearchParams, customSearch?: Record<string, any>) => {
    const { current, pageSize, tab, sorter, ...extraSearch } = params || {};
  
    const _pageNum = current || 1;
    const _pageSize = pageSize || 10;

    let _tab: any = currentTab;
    if (['string', 'number'].indexOf(typeof tab) > -1) {
      _tab = tab;
    }
    const _pagination = { current: _pageNum, pageSize: _pageSize };

    const getTableData = (_api: any) => {
      setState({ loading: true });
      let _params = {
        ...form.getValues(true),
        ...customSearch,
        ...extraSearch,
        ..._pagination,
      };

      Promise.resolve(_api(_params, sorter, { tab: _tab }))
        .then(res => {
          // TODO：这里校验res是否规范
          const { rows, data, total, pageSize, ...extraData } = res;

          setState({
            loading: false,
            dataSource: data || rows,
            ...extraData,
            pagination: {
              ..._pagination,
              total,
              pageSize: pageSize || _pageSize,
            },
          });

          searchProps?.afterSearch?.({ data, total, pageSize, ...extraData });
        })
        .catch(err => {
          setState({ loading: false });
        });
    };

    if (isFunction(api)) {
      getTableData(api);
      return;
    }
    if (isArray(api)) {
      const _api = _get(api, `[${_tab}].api`);
      if (isFunction(_api)) {
        getTableData(_api);
        return;
      }
    }
    console.warn('api 不是函数，检查 <Search /> 的 props');
  };

  const refresh = (params?: { tab?: string | number; stay?: boolean }, moreSearch?: any) => {
    const _stay = (params && params.stay) || false;
    const _tab = params && params.tab;
    const _search = moreSearch || {};
   
    doSearch(
      {
        ...params,
        current: _stay ? pagination.current : 1,
        tab: _tab,
        pageSize: pagination.pageSize,
      },
      _search
    );
  };

  const changeTab = (tab: string | number) => {
    if (['string', 'number'].indexOf(typeof tab) > -1) {
      setState({ tab });
      // refresh({ tab });
    } else {
      console.error('changeTab的入参必须是number或string');
    }
  };

  const tableNode = (
    <div
      ref={rootRef}
      className={`tr-table-wrapper ${className}`}
      style={style}
    >
      <ToolbarView
        request={api}
        doSearch={doSearch}
        refresh={refresh}
        fullScreen={fullScreen}
        title={title}
        tableSize={tableSize}
        currentTab={currentTab}
        onTabChange={onTabChange}
        toolbarAction={toolbarAction}
        toolbarRender={toolbarRender}
        setState={setState}
        getState={getState}
      />
      <TableView
        {...tableProps}
        doSearch={doSearch}
      />
    </div>
  );

  const renderTable = () => {
    if (isFunction(tableWrapper)) {
      return tableWrapper(tableNode);
    }

    return tableNode;
  };

  return (
    <div>
      <SearchView
        {...searchProps}
        form={form}
        refresh={refresh}
        getState={getState}
        hidden={hiddenSearch}
      />
      <ErrorBoundary>
        {renderTable()}
      </ErrorBoundary>
    </div>
  );
}

export default RenderCore;

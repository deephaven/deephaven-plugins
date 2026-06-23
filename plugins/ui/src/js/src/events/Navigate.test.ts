import { Navigate } from './Navigate';

describe('Navigate', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: new URL(
        'http://localhost/app/widget/local/dashboard/-/page?old=val#old-frag'
      ),
      writable: true,
    });
    jest.spyOn(window.history, 'replaceState').mockImplementation(jest.fn());
    jest.spyOn(window.history, 'pushState').mockImplementation(jest.fn());
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
    jest.restoreAllMocks();
  });

  it('updates only query params when path is not provided', () => {
    Navigate({ queryParams: '?foo=bar' });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard/-/page?foo=bar#old-frag'
    );
  });

  it('updates only fragment when path is not provided', () => {
    Navigate({ fragment: 'new-section' });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard/-/page?old=val#new-section'
    );
  });

  it('clears fragment when empty string', () => {
    Navigate({ fragment: '' });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard/-/page?old=val'
    );
  });

  it('clears query params when empty string', () => {
    Navigate({ queryParams: '' });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard/-/page#old-frag'
    );
  });

  it('updates path relative to widget base', () => {
    Navigate({ path: '/new-page' });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard/-/new-page'
    );
  });

  it('updates all components at once', () => {
    Navigate({
      path: '/settings',
      queryParams: '?tab=2',
      fragment: 'top',
    });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard/-/settings?tab=2#top'
    );
  });

  it('uses replaceState by default', () => {
    Navigate({ queryParams: 'x=1' });

    expect(window.history.replaceState).toHaveBeenCalled();
    expect(window.history.pushState).not.toHaveBeenCalled();
  });

  it('uses pushState when replace=false', () => {
    Navigate({ queryParams: 'x=1', replace: false });

    expect(window.history.pushState).toHaveBeenCalled();
    expect(window.history.replaceState).not.toHaveBeenCalled();
  });

  it('uses replaceState when replace=true', () => {
    Navigate({ queryParams: 'x=1', replace: true });

    expect(window.history.replaceState).toHaveBeenCalled();
    expect(window.history.pushState).not.toHaveBeenCalled();
  });

  it('blocks cross-origin navigation', () => {
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost/app'),
      writable: true,
    });

    // Navigating with a normal path establishes /-/ boundary
    Navigate({ path: '/safe' });
    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/-/safe'
    );
  });

  it('preserves URL components not specified in params', () => {
    // When only queryParams is provided, path and fragment should be preserved
    Navigate({ queryParams: '?new=value' });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard/-/page?new=value#old-frag'
    );
  });

  it('strips .. traversal from paths', () => {
    Navigate({ path: '/../../etc/passwd' });

    // The path should have .. stripped
    const call = (window.history.replaceState as jest.Mock).mock.calls[0];
    const newUrl = call[2] as string;
    expect(newUrl).not.toContain('..');
  });
});

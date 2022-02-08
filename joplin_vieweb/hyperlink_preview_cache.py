import hyperlink_preview as HLP
import threading
from collections import OrderedDict

_hlp_cache = OrderedDict()
_hlp_cache_lock = threading.Lock()
_HLP_DICT_MAX_SIZE = 50

class _HlpCache:
    def __init__(self) -> None:
        self.data_get = threading.Event()
        self.hlp: HLP.HyperLinkPreview = None

def get_hyperlink_preview(link_url):
    is_new = True
    with _hlp_cache_lock:
        try:
            hlp_cache = _hlp_cache[link_url]
            is_new = False
        except:
            # target link is not in cache: we compute it
            hlp_cache = _HlpCache()
            _hlp_cache[link_url] = hlp_cache
            if len(_hlp_cache) > _HLP_DICT_MAX_SIZE:
                _hlp_cache.popitem(last=False)

    # following code outside with _hlp_cache_lock to release the lock ASAP.
    if is_new:
        try:
            hlp_cache.hlp = HLP.HyperLinkPreview(url=link_url)
        except:
            del _hlp_cache[link_url]
            return None
        hlp_cache.data_get.set()
    else:
        hlp_cache.data_get.wait()

    if not hlp_cache.hlp.is_valid:
        return None
    return hlp_cache.hlp.get_data(wait_for_imgs=False)

def get_hyperlink_preview_image(link_url):
    with _hlp_cache_lock:
        try:
            hlp_cache = _hlp_cache[link_url]
        except:
            return None # unexpected... but not a big issue.

    return hlp_cache.hlp.get_data(wait_for_imgs = True)


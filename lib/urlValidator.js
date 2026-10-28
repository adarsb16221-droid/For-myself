/**
 * Validates that a URL is a legitimate, publicly accessible HTTP/HTTPS URL
 * and prevents Server-Side Request Forgery (SSRF) against internal network IPs
 * or cloud metadata endpoints.
 */
export function isSafePublicUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    
    // Disallow loopback, local, metadata addresses
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '169.254.169.254' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    // Check private IPv4 ranges: 10.x.x.x, 192.168.x.x, 172.16-31.x.x, 169.254.x.x, 127.x.x.x
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const octet1 = parseInt(ipv4Match[1], 10);
      const octet2 = parseInt(ipv4Match[2], 10);
      if (octet1 === 10) return false;
      if (octet1 === 192 && octet2 === 168) return false;
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return false;
      if (octet1 === 169 && octet2 === 254) return false;
      if (octet1 === 127 || octet1 === 0) return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { hasBackend, apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
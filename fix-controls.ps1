$file = "src\components\SpaceShooter.jsx"
$content = Get-Content $file -Raw -Encoding UTF8

# Find the start and end positions
$startMarker = "{settingsTab === 'controls' && ("
$endMarker = "{settingsTab === 'achievements' && ("

$start = $content.IndexOf($startMarker)
$end = $content.IndexOf($endMarker)

if ($start -lt 0 -or $end -lt 0) {
    Write-Host "Error: Could not find section markers"
    exit 1
}

# Extract the before and after parts
$before = $content.Substring(0, $start)
$after = $content.Substring($end)

# Create the new controls section
$newControls = @"
{settingsTab === 'controls' && (
                <div className="settings-controls">
                  <div className="controls-header">
                    <h3>⌨️ Keyboard Controls</h3>
                    <button 
                      className="reset-controls-button"
                      onClick={() => setUserSettings(prev => ({ ...prev, controls: DEFAULT_USER_SETTINGS.controls }))}
                    >
                      🔄 Reset to Default
                    </button>
                  </div>
                  
                  {remappingControl && (
                    <div className="remapping-overlay">
                      <div className="remapping-prompt">
                        <h4>Press any key for:</h4>
                        <p>{remappingControl.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}</p>
                        <p className="remapping-hint">ESC to cancel</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="control-mappings">
                    {/* Movement Controls */}
                    <div className="control-category">
                      <h4>Movement</h4>
                      {[
                        { name: 'moveUp', label: 'Move Up' },
                        { name: 'moveDown', label: 'Move Down' },
                        { name: 'moveLeft', label: 'Move Left' },
                        { name: 'moveRight', label: 'Move Right' }
                      ].map(control => (
                        <div key={control.name} className="control-row">
                          <span className="control-label">{control.label}</span>
                          <div className="control-keys">
                            {userSettings.controls[control.name].map((key, idx) => (
                              <button
                                key={idx}
                                className="key-button"
                                onClick={() => {
                                  setRemappingControl(control.name);
                                  setRemappingSlot(idx);
                                }}
                              >
                                {key.replace('Key', '').replace('Arrow', '').replace('Digit', '')}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Combat Controls */}
                    <div className="control-category">
                      <h4>Combat</h4>
                      {[
                        { name: 'shoot', label: 'Shoot' },
                        { name: 'missile', label: 'Missile' },
                        { name: 'special', label: 'Special' },
                        { name: 'bomb', label: 'Bomb' }
                      ].map(control => (
                        <div key={control.name} className="control-row">
                          <span className="control-label">{control.label}</span>
                          <div className="control-keys">
                            {userSettings.controls[control.name].map((key, idx) => (
                              <button
                                key={idx}
                                className="key-button"
                                onClick={() => {
                                  setRemappingControl(control.name);
                                  setRemappingSlot(idx);
                                }}
                              >
                                {key.replace('Key', '').replace('Arrow', '').replace('Digit', '')}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* System Controls */}
                    <div className="control-category">
                      <h4>System</h4>
                      {[
                        { name: 'dash', label: 'Dash' },
                        { name: 'togglePolarity', label: 'Toggle Polarity' },
                        { name: 'toggleForce', label: 'Toggle Force' },
                        { name: 'pause', label: 'Pause' }
                      ].map(control => (
                        <div key={control.name} className="control-row">
                          <span className="control-label">{control.label}</span>
                          <div className="control-keys">
                            {userSettings.controls[control.name].map((key, idx) => (
                              <button
                                key={idx}
                                className="key-button"
                                onClick={() => {
                                  setRemappingControl(control.name);
                                  setRemappingSlot(idx);
                                }}
                              >
                                {key.replace('Key', '').replace('Arrow', '').replace('Digit', '').replace('Shift', 'Shift').replace('Left', '').replace('Right', '')}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="controls-note">
                    <p>💡 Click any key button to remap it</p>
                    <p>🎮 Gamepad controls are automatic and cannot be remapped</p>
                  </div>
                </div>
              )}

              {/* Achievements Tab */}
              
"@

# Combine the parts
$newContent = $before + $newControls + $after

# Write back to file
$newContent | Set-Content $file -NoNewline -Encoding UTF8

Write-Host "Successfully replaced controls section"

import React from "react";
import { X } from "lucide-react";
import {
  AlertModalForm,
  AnchorModalForm,
  BadgeModalForm,
  CTAModalForm,
  CalloutModalForm,
  CitationModalForm,
  CodeDiffModalForm,
  CodeModalForm,
  ComparisonModalForm,
  DefinitionModalForm,
  DetailsModalForm,
  FAQModalForm,
  FigureModalForm,
  FootnoteModalForm,
  KbdModalForm,
  KeyValueModalForm,
  LinkModalForm,
  QuoteModalForm,
  StepsModalForm,
  TableModalForm,
  TabsModalForm,
  TimelineModalForm,
  VersionModalForm,
  VideoModalForm,
  DownloadLinkModalForm,
  PlaygroundModalForm,
  GuideLinkModalForm,
} from "../EditorToolForms";
import QuizBuilderModal from "../quiz/QuizBuilderModal";

interface ModalsContainerProps {
  insertText: (text: string) => void;
  currentUserId: string;
  // Modal visibility states
  showLinkModal: boolean; setShowLinkModal: (v: boolean) => void;
  showTableModal: boolean; setShowTableModal: (v: boolean) => void;
  showVideoModal: boolean; setShowVideoModal: (v: boolean) => void;
  showCalloutModal: boolean; setShowCalloutModal: (v: boolean) => void;
  showCodeModal: boolean; setShowCodeModal: (v: boolean) => void;
  showFigureModal: boolean; setShowFigureModal: (v: boolean) => void;
  showDetailsModal: boolean; setShowDetailsModal: (v: boolean) => void;
  showFootnoteModal: boolean; setShowFootnoteModal: (v: boolean) => void;
  showBadgeModal: boolean; setShowBadgeModal: (v: boolean) => void;
  showKbdModal: boolean; setShowKbdModal: (v: boolean) => void;
  showQuoteModal: boolean; setShowQuoteModal: (v: boolean) => void;
  showAnchorModal: boolean; setShowAnchorModal: (v: boolean) => void;
  showCitationModal: boolean; setShowCitationModal: (v: boolean) => void;
  showCTAModal: boolean; setShowCTAModal: (v: boolean) => void;
  showStepsModal: boolean; setShowStepsModal: (v: boolean) => void;
  showTimelineModal: boolean; setShowTimelineModal: (v: boolean) => void;
  showComparisonModal: boolean; setShowComparisonModal: (v: boolean) => void;
  showAlertModal: boolean; setShowAlertModal: (v: boolean) => void;
  showTabsModal: boolean; setShowTabsModal: (v: boolean) => void;
  showDefinitionModal: boolean; setShowDefinitionModal: (v: boolean) => void;
  showCodeDiffModal: boolean; setShowCodeDiffModal: (v: boolean) => void;
  showFAQModal: boolean; setShowFAQModal: (v: boolean) => void;
  showVersionModal: boolean; setShowVersionModal: (v: boolean) => void;
  showKeyValueModal: boolean; setShowKeyValueModal: (v: boolean) => void;
  showPlaygroundModal: boolean; setShowPlaygroundModal: (v: boolean) => void;
  showDownloadLinkModal: boolean; setShowDownloadLinkModal: (v: boolean) => void;
  showQuizBuilder: boolean; setShowQuizBuilder: (v: boolean) => void;
  showGuideLinkModal: boolean; setShowGuideLinkModal: (v: boolean) => void;
}

const ToolModalWrapper: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ModalsContainer: React.FC<ModalsContainerProps> = (props) => {
  const { insertText, currentUserId } = props;

  return (
    <>
      {props.showLinkModal && (
        <ToolModalWrapper title="Insert Link" onClose={() => props.setShowLinkModal(false)}>
          <LinkModalForm 
            onInsert={(text, url) => {
              insertText(`[${text}](${url})`);
              props.setShowLinkModal(false);
            }} 
            onClose={() => props.setShowLinkModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showTableModal && (
        <ToolModalWrapper title="Insert Table" onClose={() => props.setShowTableModal(false)}>
          <TableModalForm 
            onInsert={(rows, cols) => {
              let table = "\n| " + Array(cols).fill("Header").join(" | ") + " |\n";
              table += "| " + Array(cols).fill("---").join(" | ") + " |\n";
              for (let i = 0; i < rows; i++) {
                table += "| " + Array(cols).fill("Cell").join(" | ") + " |\n";
              }
              insertText(table);
              props.setShowTableModal(false);
            }} 
            onClose={() => props.setShowTableModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showVideoModal && (
        <ToolModalWrapper title="Insert Video" onClose={() => props.setShowVideoModal(false)}>
          <VideoModalForm 
            onInsert={(embedCode) => {
              insertText(embedCode);
              props.setShowVideoModal(false);
            }} 
            onClose={() => props.setShowVideoModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showCalloutModal && (
        <ToolModalWrapper title="Insert Callout" onClose={() => props.setShowCalloutModal(false)}>
          <CalloutModalForm 
            onInsert={(type, message) => {
              insertText(`\n:::callout{type="${type}"}\n${message}\n:::\n`);
              props.setShowCalloutModal(false);
            }} 
            onClose={() => props.setShowCalloutModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showCodeModal && (
        <ToolModalWrapper title="Insert Code Block" onClose={() => props.setShowCodeModal(false)}>
          <CodeModalForm 
            onInsert={(code, language) => {
              insertText(`\n\`\`\`${language}\n${code}\n\`\`\`\n`);
              props.setShowCodeModal(false);
            }} 
            onClose={() => props.setShowCodeModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showFigureModal && (
        <ToolModalWrapper title="Insert Figure" onClose={() => props.setShowFigureModal(false)}>
          <FigureModalForm 
            onInsert={(url, caption) => {
              insertText(`\n<figure>\n  <img src="${url}" alt="${caption}">\n  <figcaption>${caption}</figcaption>\n</figure>\n`);
              props.setShowFigureModal(false);
            }} 
            onClose={() => props.setShowFigureModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showDetailsModal && (
        <ToolModalWrapper title="Insert Expandable Details" onClose={() => props.setShowDetailsModal(false)}>
          <DetailsModalForm 
            onInsert={(summary, content) => {
              insertText(`\n<details>\n<summary>${summary}</summary>\n\n${content}\n</details>\n`);
              props.setShowDetailsModal(false);
            }} 
            onClose={() => props.setShowDetailsModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showFootnoteModal && (
        <ToolModalWrapper title="Insert Footnote" onClose={() => props.setShowFootnoteModal(false)}>
          <FootnoteModalForm 
            onInsert={(marker, _definition) => {
              insertText(`[^${marker}]`);
              props.setShowFootnoteModal(false);
            }} 
            onClose={() => props.setShowFootnoteModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showBadgeModal && (
        <ToolModalWrapper title="Insert Badge" onClose={() => props.setShowBadgeModal(false)}>
          <BadgeModalForm 
            onInsert={(text) => {
              insertText(` <span class="badge">${text}</span> `);
              props.setShowBadgeModal(false);
            }} 
            onClose={() => props.setShowBadgeModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showKbdModal && (
        <ToolModalWrapper title="Insert Keyboard Shortcut" onClose={() => props.setShowKbdModal(false)}>
          <KbdModalForm 
            onInsert={(keys) => {
              insertText(keys.map(k => `<kbd>${k}</kbd>`).join("+"));
              props.setShowKbdModal(false);
            }} 
            onClose={() => props.setShowKbdModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showQuoteModal && (
        <ToolModalWrapper title="Insert Quote" onClose={() => props.setShowQuoteModal(false)}>
          <QuoteModalForm 
            onInsert={(quote, author) => {
              insertText(`\n> ${quote}\n${author ? `> — ${author}\n` : ""}`);
              props.setShowQuoteModal(false);
            }} 
            onClose={() => props.setShowQuoteModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showAnchorModal && (
        <ToolModalWrapper title="Insert Anchor" onClose={() => props.setShowAnchorModal(false)}>
          <AnchorModalForm 
            defaultSlug=""
            onInsert={(id) => {
              insertText(`<a id="${id}"></a>`);
              props.setShowAnchorModal(false);
            }} 
            onClose={() => props.setShowAnchorModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showCitationModal && (
        <ToolModalWrapper title="Insert Citation" onClose={() => props.setShowCitationModal(false)}>
          <CitationModalForm 
            onInsert={(citation, sourceUrl) => {
              insertText(` [^${citation}]${sourceUrl ? `(${sourceUrl})` : ""} `);
              props.setShowCitationModal(false);
            }} 
            onClose={() => props.setShowCitationModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showCTAModal && (
        <ToolModalWrapper title="Insert CTA" onClose={() => props.setShowCTAModal(false)}>
          <CTAModalForm 
            onInsert={(label, url) => {
              insertText(`\n:::cta\n[${label}](${url})\n:::\n`);
              props.setShowCTAModal(false);
            }} 
            onClose={() => props.setShowCTAModal(false)} 
          />
        </ToolModalWrapper>
      )}
      {props.showStepsModal && (
        <ToolModalWrapper title="Insert Steps" onClose={() => props.setShowStepsModal(false)}>
          <StepsModalForm onInsert={(c) => { insertText(c); props.setShowStepsModal(false); }} onClose={() => props.setShowStepsModal(false)} />
        </ToolModalWrapper>
      )}
      {props.showTimelineModal && (
        <ToolModalWrapper title="Insert Timeline" onClose={() => props.setShowTimelineModal(false)}>
          <TimelineModalForm onInsert={(c) => { insertText(c); props.setShowTimelineModal(false); }} onClose={() => props.setShowTimelineModal(false)} />
        </ToolModalWrapper>
      )}
      {props.showComparisonModal && (
        <ToolModalWrapper title="Insert Comparison Table" onClose={() => props.setShowComparisonModal(false)}>
          <ComparisonModalForm onInsert={(c) => { insertText(c); props.setShowComparisonModal(false); }} onClose={() => props.setShowComparisonModal(false)} />
        </ToolModalWrapper>
      )}
      {props.showAlertModal && (
        <ToolModalWrapper title="Insert Alert Notice" onClose={() => props.setShowAlertModal(false)}>
          <AlertModalForm onInsert={(c) => { insertText(c); props.setShowAlertModal(false); }} onClose={() => props.setShowAlertModal(false)} />
        </ToolModalWrapper>
      )}
      {props.showTabsModal && (
        <ToolModalWrapper title="Insert Tabs" onClose={() => props.setShowTabsModal(false)}>
          <TabsModalForm onInsert={(c) => { insertText(c); props.setShowTabsModal(false); }} onClose={() => props.setShowTabsModal(false)} />
        </ToolModalWrapper>
      )}
      {props.showDefinitionModal && (
        <ToolModalWrapper title="Insert Definition List" onClose={() => props.setShowDefinitionModal(false)}>
          <DefinitionModalForm onInsert={(c) => { insertText(c); props.setShowDefinitionModal(false); }} onClose={() => props.setShowDefinitionModal(false)} />
        </ToolModalWrapper>
      )}
      {props.showCodeDiffModal && (
        <ToolModalWrapper title="Insert Code Difference" onClose={() => props.setShowCodeDiffModal(false)}>
          <CodeDiffModalForm onInsert={(c) => { insertText(c); props.setShowCodeDiffModal(false); }} onClose={() => props.setShowCodeDiffModal(false)} />
        </ToolModalWrapper>
      )}
      {props.showFAQModal && (
        <ToolModalWrapper title="Insert FAQ Section" onClose={() => props.setShowFAQModal(false)}>
          <FAQModalForm onInsert={(c) => { insertText(c); props.setShowFAQModal(false); }} onClose={() => props.setShowFAQModal(false)} />
        </ToolModalWrapper>
      )}
      {props.showVersionModal && (
        <ToolModalWrapper title="Insert Version History" onClose={() => props.setShowVersionModal(false)}>
          <VersionModalForm onInsert={(c) => { insertText(c); props.setShowVersionModal(false); }} onClose={() => props.setShowVersionModal(false)} />
        </ToolModalWrapper>
      )}
      {props.showKeyValueModal && (
        <ToolModalWrapper title="Insert Key-Value Table" onClose={() => props.setShowKeyValueModal(false)}>
          <KeyValueModalForm onInsert={(c) => { insertText(c); props.setShowKeyValueModal(false); }} onClose={() => props.setShowKeyValueModal(false)} />
        </ToolModalWrapper>
      )}
      {props.showPlaygroundModal && (
        <ToolModalWrapper title="Insert Interactive Demo" onClose={() => props.setShowPlaygroundModal(false)}>
          <PlaygroundModalForm onInsert={(c) => { insertText(c); props.setShowPlaygroundModal(false); }} onClose={() => props.setShowPlaygroundModal(false)} />
        </ToolModalWrapper>
      )}
      {props.showDownloadLinkModal && (
        <ToolModalWrapper title="Insert Download Link" onClose={() => props.setShowDownloadLinkModal(false)}>
          <DownloadLinkModalForm onInsert={(c) => { insertText(c); props.setShowDownloadLinkModal(false); }} onClose={() => props.setShowDownloadLinkModal(false)} />
        </ToolModalWrapper>
      )}
      {props.showGuideLinkModal && (
        <ToolModalWrapper title="Insert Guide Link" onClose={() => props.setShowGuideLinkModal(false)}>
          <GuideLinkModalForm 
            currentUserId={currentUserId}
            onInsert={(c) => { insertText(c); props.setShowGuideLinkModal(false); }} 
            onClose={() => props.setShowGuideLinkModal(false)} 
          />
        </ToolModalWrapper>
      )}
      
      {props.showQuizBuilder && (
        <ToolModalWrapper title="Build Quiz" onClose={() => props.setShowQuizBuilder(false)}>
          <QuizBuilderModal
            onClose={() => props.setShowQuizBuilder(false)}
            onInsert={(quizData: Record<string, any>) => {
              const quizBlock = `\n\`\`\`quiz\n${JSON.stringify(quizData, null, 2)}\n\`\`\`\n`;
              insertText(quizBlock);
              props.setShowQuizBuilder(false);
            }}
          />
        </ToolModalWrapper>
      )}
    </>
  );
};
